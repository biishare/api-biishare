import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";
import type { CookieOptions, Response } from "express";
import { promisify } from "util";

import { isLegacyCreatorEmail } from "../../config/legacyCreator";
import UserModel, { IUser } from "../../models/user/app";
import { getEnvValue, isProduction } from "../../config/security";
import { normalizeUsername } from "./username";

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string) =>
  Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export const getAuthSecret = () =>
  getEnvValue("AUTH_TOKEN_SECRET") ||
  (!isProduction() ? "api-bii-development-token-secret" : "");

const getAuthTokenExpiresInSeconds = () => {
  const expiresIn = Number(getEnvValue("AUTH_TOKEN_EXPIRES_IN_SECONDS") || 604800);

  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    return 604800;
  }

  return expiresIn;
};

const getAuthCookieSameSite = (): CookieOptions["sameSite"] => {
  const value = getEnvValue("AUTH_COOKIE_SAME_SITE")?.toLowerCase();

  if (value === "strict" || value === "none") {
    return value;
  }

  return "lax";
};

const getAuthCookieSecure = (sameSite: CookieOptions["sameSite"]) => {
  const secureValue = getEnvValue("AUTH_COOKIE_SECURE");

  if (secureValue) {
    return secureValue === "true";
  }

  return isProduction() || sameSite === "none";
};

const getAuthCookieOptions = (maxAge?: number): CookieOptions => {
  const sameSite = getAuthCookieSameSite();
  const options: CookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite,
    secure: getAuthCookieSecure(sameSite) || sameSite === "none",
  };

  if (typeof maxAge === "number") {
    options.maxAge = maxAge;
  }

  const cookieDomain = getEnvValue("AUTH_COOKIE_DOMAIN");

  if (cookieDomain) {
    options.domain = cookieDomain;
  }

  return options;
};

export const getAuthCookieName = () =>
  getEnvValue("AUTH_COOKIE_NAME") || "biishare_session";

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(
    getAuthCookieName(),
    token,
    getAuthCookieOptions(getAuthTokenExpiresInSeconds() * 1000)
  );
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(getAuthCookieName(), getAuthCookieOptions());
};

export const getAuthTokenFromCookieHeader = (
  cookieHeader?: string
): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookieName = `${getAuthCookieName()}=`;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieName));

  if (!cookie) {
    return undefined;
  }

  const token = cookie.slice(cookieName.length);

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(
    password,
    salt,
    passwordKeyLength
  )) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (
  password: string,
  storedHash: string
): Promise<boolean> => {
  const [algorithm, salt, key] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const storedKey = Buffer.from(key, "hex");
  const derivedKey = (await scrypt(
    password,
    salt,
    storedKey.length
  )) as Buffer;

  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
};

export const sanitizeUser = (user: IUser) => {
  const isLegacyCreator = isLegacyCreatorEmail(user.email);
  const creatorStatus = isLegacyCreator ? "approved" : user.creatorStatus || "none";

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    preferredLocale: user.preferredLocale,
    creatorStatus,
    isCreator: creatorStatus === "approved",
    creatorAppliedAt: user.creatorAppliedAt,
    creatorApprovedAt: user.creatorApprovedAt,
    creatorApplication: user.creatorApplication,
    nameUpdatedAt: user.nameUpdatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const ensureUserUsername = async (user: IUser): Promise<IUser> => {
  if (user.username) {
    return user;
  }

  const fallbackBase = `user-${user._id.toString().slice(-6)}`;
  const baseUsername = normalizeUsername(user.name) || fallbackBase;
  let username = baseUsername.slice(0, 30);
  let suffix = 2;

  while (await UserModel.exists({ username, _id: { $ne: user._id } })) {
    const nextSuffix = `-${suffix}`;
    username = `${baseUsername.slice(0, 30 - nextSuffix.length)}${nextSuffix}`;
    suffix += 1;
  }

  user.username = username;
  await UserModel.updateOne({ _id: user._id }, { $set: { username } });

  return user;
};

export const createUniqueUsername = async (value: string): Promise<string> => {
  const fallbackBase = `user-${randomBytes(3).toString("hex")}`;
  const normalizedValue = normalizeUsername(value);
  const baseUsername = (
    normalizedValue.length >= 3 ? normalizedValue : fallbackBase
  )
    .slice(0, 30)
    .replace(/-+$/g, "");
  let username = baseUsername;
  let suffix = 2;

  while (await UserModel.exists({ username })) {
    const nextSuffix = `-${suffix}`;
    username = `${baseUsername.slice(0, 30 - nextSuffix.length)}${nextSuffix}`;
    suffix += 1;
  }

  return username;
};

export const createAuthToken = (user: IUser): string => {
  const secret = getAuthSecret();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = getAuthTokenExpiresInSeconds();

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    sub: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    iat: now,
    exp: now + expiresIn,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest();

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
};

export const verifyAuthToken = (token: string): { userId: string } | null => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", getAuthSecret())
    .update(unsignedToken)
    .digest();
  const receivedSignature = base64UrlDecode(encodedSignature);

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));

    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { userId: payload.sub };
  } catch {
    return null;
  }
};
