import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Request, Response } from "express";

import UserModel, { IUser } from "../../models/user/app";
import {
  createAuthToken,
  createUniqueUsername,
  ensureUserUsername,
  getAuthSecret,
  setAuthCookie,
} from "./utils";
import {
  getConfiguredRedirectOrigins,
  getEnvValue,
  isAllowedOrigin,
} from "../../config/security";

type SocialProvider = "google" | "facebook";

type OAuthState = {
  provider: SocialProvider;
  redirectUri: string;
  iat: number;
  nonce: string;
};

type SocialProfile = {
  provider: SocialProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type OAuthConfig = {
  clientId: string | undefined;
  clientSecret: string | undefined;
};

type ResolvedOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type FacebookTokenResponse = {
  access_token?: string;
};

type FacebookUserInfo = {
  id?: string;
  email?: string;
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
};

const stateMaxAgeMs = 10 * 60 * 1000;

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string) =>
  Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const getFirstHeaderValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getQueryStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
};

const isAllowedRedirectUri = (url: URL) =>
  isAllowedOrigin(url.toString(), getConfiguredRedirectOrigins());

const getDefaultClientRedirectUri = () => {
  const configuredUrl = getEnvValue("AUTH_SUCCESS_REDIRECT_URL");

  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);

      if (isAllowedRedirectUri(url)) {
        return url.toString();
      }
    } catch {
      return "http://localhost:3000/profile";
    }
  }

  return "http://localhost:3000/profile";
};

const getClientRedirectUri = (req: Request) => {
  const redirectUri = getQueryStringValue(req.query.redirect_uri);

  if (!redirectUri) {
    return getDefaultClientRedirectUri();
  }

  try {
    const url = new URL(redirectUri);

    if (!isAllowedRedirectUri(url)) {
      return getDefaultClientRedirectUri();
    }

    return url.toString();
  } catch {
    return getDefaultClientRedirectUri();
  }
};

const appendRedirectError = (redirectUri: string, error: string) => {
  const url = new URL(redirectUri);
  url.searchParams.set("auth_error", error);
  return url.toString();
};

const getRequestBaseUrl = (req: Request) => {
  const configuredBaseUrl =
    getEnvValue("AUTH_CALLBACK_BASE_URL") ||
    getEnvValue("API_PUBLIC_BASE_URL");

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  const protocol =
    getFirstHeaderValue(req.headers["x-forwarded-proto"]) || req.protocol;
  const host =
    getFirstHeaderValue(req.headers["x-forwarded-host"]) || req.headers.host;

  return `${protocol}://${host}`;
};

const getProviderCallbackUrl = (req: Request, provider: SocialProvider) =>
  new URL(`/auth/${provider}/callback`, getRequestBaseUrl(req)).toString();

const signState = (payload: OAuthState) => {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest();

  return `${encodedPayload}.${base64UrlEncode(signature)}`;
};

const parseState = (state: string): OAuthState | null => {
  const [encodedPayload, encodedSignature] = state.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
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
      (payload.provider !== "google" && payload.provider !== "facebook") ||
      typeof payload.redirectUri !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.nonce !== "string" ||
      Date.now() - payload.iat > stateMaxAgeMs
    ) {
      return null;
    }

    const redirectUrl = new URL(payload.redirectUri);

    if (!isAllowedRedirectUri(redirectUrl)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const getOAuthConfig = (provider: SocialProvider): OAuthConfig => {
  if (provider === "google") {
    return {
      clientId:
        getEnvValue("GOOGLE_CLIENT_ID") ||
        getEnvValue("GOOGLE_OAUTH_CLIENT_ID"),
      clientSecret:
        getEnvValue("GOOGLE_CLIENT_SECRET") ||
        getEnvValue("GOOGLE_OAUTH_CLIENT_SECRET"),
    };
  }

  return {
    clientId:
      getEnvValue("FACEBOOK_APP_ID") || getEnvValue("FACEBOOK_CLIENT_ID"),
    clientSecret:
      getEnvValue("FACEBOOK_APP_SECRET") ||
      getEnvValue("FACEBOOK_CLIENT_SECRET"),
  };
};

const createProviderAuthUrl = (
  req: Request,
  provider: SocialProvider,
  config: ResolvedOAuthConfig,
  redirectUri: string
) => {
  const state = signState({
    provider,
    redirectUri,
    iat: Date.now(),
    nonce: randomBytes(16).toString("hex"),
  });
  const callbackUrl = getProviderCallbackUrl(req, provider);

  if (provider === "google") {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "select_account");

    return authUrl.toString();
  }

  const facebookVersion = getEnvValue("FACEBOOK_GRAPH_VERSION") || "v20.0";
  const authUrl = new URL(
    `https://www.facebook.com/${facebookVersion}/dialog/oauth`
  );
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "email,public_profile");
  authUrl.searchParams.set("state", state);

  return authUrl.toString();
};

const exchangeGoogleCode = async (
  code: string,
  callbackUrl: string,
  config: ResolvedOAuthConfig
): Promise<SocialProfile> => {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed.");
  }

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenData.access_token) {
    throw new Error("Google access token missing.");
  }

  const userResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error("Google profile request failed.");
  }

  const profile = (await userResponse.json()) as GoogleUserInfo;

  if (!profile.sub || !profile.email || profile.email_verified === false) {
    throw new Error("Google profile is missing a verified email.");
  }

  const email = profile.email.trim().toLowerCase();

  const socialProfile: SocialProfile = {
    provider: "google",
    providerId: profile.sub,
    email,
    name: normalizeDisplayName(profile.name, email),
  };

  if (profile.picture) {
    socialProfile.avatarUrl = profile.picture;
  }

  return socialProfile;
};

const exchangeFacebookCode = async (
  code: string,
  callbackUrl: string,
  config: ResolvedOAuthConfig
): Promise<SocialProfile> => {
  const facebookVersion = getEnvValue("FACEBOOK_GRAPH_VERSION") || "v20.0";
  const tokenUrl = new URL(
    `https://graph.facebook.com/${facebookVersion}/oauth/access_token`
  );
  tokenUrl.searchParams.set("client_id", config.clientId);
  tokenUrl.searchParams.set("client_secret", config.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", callbackUrl);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl);

  if (!tokenResponse.ok) {
    throw new Error("Facebook token exchange failed.");
  }

  const tokenData = (await tokenResponse.json()) as FacebookTokenResponse;

  if (!tokenData.access_token) {
    throw new Error("Facebook access token missing.");
  }

  const profileUrl = new URL(
    `https://graph.facebook.com/${facebookVersion}/me`
  );
  profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  profileUrl.searchParams.set("access_token", tokenData.access_token);

  const userResponse = await fetch(profileUrl);

  if (!userResponse.ok) {
    throw new Error("Facebook profile request failed.");
  }

  const profile = (await userResponse.json()) as FacebookUserInfo;

  if (!profile.id || !profile.email) {
    throw new Error("Facebook profile is missing an email.");
  }

  const email = profile.email.trim().toLowerCase();

  const socialProfile: SocialProfile = {
    provider: "facebook",
    providerId: profile.id,
    email,
    name: normalizeDisplayName(profile.name, email),
  };

  if (profile.picture?.data?.url) {
    socialProfile.avatarUrl = profile.picture.data.url;
  }

  return socialProfile;
};

const normalizeDisplayName = (name: string | undefined, email: string) => {
  const trimmedName = name?.trim();

  if (trimmedName && trimmedName.length >= 3) {
    return trimmedName.slice(0, 100);
  }

  const emailName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (emailName && emailName.length >= 3) {
    return emailName.slice(0, 100);
  }

  return "Utilizador Biishare";
};

const getProviderField = (provider: SocialProvider) =>
  provider === "google" ? "googleId" : "facebookId";

const findOrCreateSocialUser = async (
  profile: SocialProfile
): Promise<IUser> => {
  const providerField = getProviderField(profile.provider);
  let user = await UserModel.findOne({ [providerField]: profile.providerId });

  if (!user) {
    user = await UserModel.findOne({ email: profile.email });
  }

  if (user) {
    user.set(providerField, profile.providerId);

    if (!user.avatarUrl && profile.avatarUrl) {
      user.avatarUrl = profile.avatarUrl;
    }

    await user.save();
    return ensureUserUsername(user);
  }

  const username = await createUniqueUsername(
    profile.name || profile.email.split("@")[0] || profile.provider
  );
  const userPayload = {
    name: profile.name,
    username,
    email: profile.email,
    [providerField]: profile.providerId,
    ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
  };

  return UserModel.create(userPayload);
};

const startSocialAuth = (provider: SocialProvider) => (
  req: Request,
  res: Response
): void => {
  const redirectUri = getClientRedirectUri(req);
  const config = getOAuthConfig(provider);

  if (!config.clientId || !config.clientSecret) {
    res.redirect(appendRedirectError(redirectUri, "provider_not_configured"));
    return;
  }

  const resolvedConfig = {
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  };

  res.redirect(createProviderAuthUrl(req, provider, resolvedConfig, redirectUri));
};

const handleSocialCallback = (provider: SocialProvider) => async (
  req: Request,
  res: Response
): Promise<void> => {
  const stateValue = getQueryStringValue(req.query.state);
  const state = stateValue ? parseState(stateValue) : null;

  if (!state || state.provider !== provider) {
    res.status(400).json({ error: "Pedido de autenticacao invalido." });
    return;
  }

  if (getQueryStringValue(req.query.error)) {
    res.redirect(appendRedirectError(state.redirectUri, "access_denied"));
    return;
  }

  const code = getQueryStringValue(req.query.code);
  const config = getOAuthConfig(provider);

  if (!code || !config.clientId || !config.clientSecret) {
    res.redirect(appendRedirectError(state.redirectUri, "oauth_failed"));
    return;
  }

  try {
    const callbackUrl = getProviderCallbackUrl(req, provider);
    const resolvedConfig = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    };
    const profile =
      provider === "google"
        ? await exchangeGoogleCode(
            code,
            callbackUrl,
            resolvedConfig
          )
        : await exchangeFacebookCode(
            code,
            callbackUrl,
            resolvedConfig
          );
    const user = await findOrCreateSocialUser(profile);

    setAuthCookie(res, createAuthToken(user));
    res.redirect(state.redirectUri);
  } catch (error) {
    console.error(error);
    res.redirect(appendRedirectError(state.redirectUri, "oauth_failed"));
  }
};

export const googleAuth = startSocialAuth("google");
export const googleCallback = handleSocialCallback("google");
export const facebookAuth = startSocialAuth("facebook");
export const facebookCallback = handleSocialCallback("facebook");
