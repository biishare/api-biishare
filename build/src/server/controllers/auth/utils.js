"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthToken = exports.createAuthToken = exports.ensureUserUsername = exports.sanitizeUser = exports.verifyPassword = exports.hashPassword = exports.getAuthTokenFromCookieHeader = exports.clearAuthCookie = exports.setAuthCookie = exports.getAuthCookieName = void 0;
const crypto_1 = require("crypto");
const util_1 = require("util");
const app_1 = __importDefault(require("../../models/user/app"));
const username_1 = require("./username");
const scrypt = (0, util_1.promisify)(crypto_1.scrypt);
const passwordKeyLength = 64;
const base64UrlEncode = (value) => Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const base64UrlDecode = (value) => Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const getAuthSecret = () => process.env.AUTH_TOKEN_SECRET ||
    process.env.DB_PASS ||
    "api-bii-development-token-secret";
const getAuthTokenExpiresInSeconds = () => Number(process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS || 604800);
const getAuthCookieSameSite = () => {
    var _a;
    const value = (_a = process.env.AUTH_COOKIE_SAME_SITE) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (value === "strict" || value === "none") {
        return value;
    }
    return "lax";
};
const getAuthCookieSecure = (sameSite) => {
    if (process.env.AUTH_COOKIE_SECURE) {
        return process.env.AUTH_COOKIE_SECURE === "true";
    }
    return process.env.NODE_ENV === "production" || sameSite === "none";
};
const getAuthCookieOptions = (maxAge) => {
    const sameSite = getAuthCookieSameSite();
    const options = {
        httpOnly: true,
        path: "/",
        sameSite,
        secure: getAuthCookieSecure(sameSite),
    };
    if (typeof maxAge === "number") {
        options.maxAge = maxAge;
    }
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};
const getAuthCookieName = () => process.env.AUTH_COOKIE_NAME || "biishare_session";
exports.getAuthCookieName = getAuthCookieName;
const setAuthCookie = (res, token) => {
    res.cookie((0, exports.getAuthCookieName)(), token, getAuthCookieOptions(getAuthTokenExpiresInSeconds() * 1000));
};
exports.setAuthCookie = setAuthCookie;
const clearAuthCookie = (res) => {
    res.clearCookie((0, exports.getAuthCookieName)(), getAuthCookieOptions());
};
exports.clearAuthCookie = clearAuthCookie;
const getAuthTokenFromCookieHeader = (cookieHeader) => {
    if (!cookieHeader) {
        return undefined;
    }
    const cookieName = `${(0, exports.getAuthCookieName)()}=`;
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
    }
    catch {
        return token;
    }
};
exports.getAuthTokenFromCookieHeader = getAuthTokenFromCookieHeader;
const hashPassword = async (password) => {
    const salt = (0, crypto_1.randomBytes)(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, passwordKeyLength));
    return `scrypt:${salt}:${derivedKey.toString("hex")}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = async (password, storedHash) => {
    const [algorithm, salt, key] = storedHash.split(":");
    if (algorithm !== "scrypt" || !salt || !key) {
        return false;
    }
    const storedKey = Buffer.from(key, "hex");
    const derivedKey = (await scrypt(password, salt, storedKey.length));
    return (storedKey.length === derivedKey.length &&
        (0, crypto_1.timingSafeEqual)(storedKey, derivedKey));
};
exports.verifyPassword = verifyPassword;
const sanitizeUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
exports.sanitizeUser = sanitizeUser;
const ensureUserUsername = async (user) => {
    if (user.username) {
        return user;
    }
    const fallbackBase = `user-${user._id.toString().slice(-6)}`;
    const baseUsername = (0, username_1.normalizeUsername)(user.name) || fallbackBase;
    let username = baseUsername.slice(0, 30);
    let suffix = 2;
    while (await app_1.default.exists({ username, _id: { $ne: user._id } })) {
        const nextSuffix = `-${suffix}`;
        username = `${baseUsername.slice(0, 30 - nextSuffix.length)}${nextSuffix}`;
        suffix += 1;
    }
    user.username = username;
    await app_1.default.updateOne({ _id: user._id }, { $set: { username } });
    return user;
};
exports.ensureUserUsername = ensureUserUsername;
const createAuthToken = (user) => {
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
    const signature = (0, crypto_1.createHmac)("sha256", secret)
        .update(unsignedToken)
        .digest();
    return `${unsignedToken}.${base64UrlEncode(signature)}`;
};
exports.createAuthToken = createAuthToken;
const verifyAuthToken = (token) => {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        return null;
    }
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = (0, crypto_1.createHmac)("sha256", getAuthSecret())
        .update(unsignedToken)
        .digest();
    const receivedSignature = base64UrlDecode(encodedSignature);
    if (expectedSignature.length !== receivedSignature.length ||
        !(0, crypto_1.timingSafeEqual)(expectedSignature, receivedSignature)) {
        return null;
    }
    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
        if (typeof payload.sub !== "string" ||
            typeof payload.exp !== "number" ||
            payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        return { userId: payload.sub };
    }
    catch {
        return null;
    }
};
exports.verifyAuthToken = verifyAuthToken;
