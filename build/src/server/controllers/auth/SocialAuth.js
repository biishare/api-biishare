"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookCallback = exports.facebookAuth = exports.googleCallback = exports.googleAuth = void 0;
const crypto_1 = require("crypto");
const app_1 = __importDefault(require("../../models/user/app"));
const utils_1 = require("./utils");
const stateMaxAgeMs = 10 * 60 * 1000;
const defaultLocalOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://localhost:3007",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3006",
    "http://127.0.0.1:3007",
];
const base64UrlEncode = (value) => Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const base64UrlDecode = (value) => Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const getFirstHeaderValue = (value) => Array.isArray(value) ? value[0] : value;
const getQueryStringValue = (value) => {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
    }
    return undefined;
};
const splitCsv = (value) => (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const getEnvValue = (name) => {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value) {
        return undefined;
    }
    const duplicatedKeyPrefix = `${name}=`;
    if (value.startsWith(duplicatedKeyPrefix)) {
        return value.slice(duplicatedKeyPrefix.length).trim() || undefined;
    }
    return value;
};
const getOrigin = (value) => {
    try {
        return new URL(value).origin;
    }
    catch {
        return undefined;
    }
};
const getConfiguredRedirectOrigins = () => {
    const origins = [
        ...defaultLocalOrigins,
        ...splitCsv(process.env.CORS_ORIGINS),
        ...splitCsv(process.env.AUTH_REDIRECT_ORIGINS),
    ];
    if (process.env.AUTH_SUCCESS_REDIRECT_URL) {
        origins.push(process.env.AUTH_SUCCESS_REDIRECT_URL);
    }
    return new Set(origins.map(getOrigin).filter(Boolean));
};
const isPrivateDevelopmentOrigin = (url) => {
    if (process.env.NODE_ENV === "production") {
        return false;
    }
    const hostname = url.hostname.toLowerCase();
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    const isPrivateIPv4 = /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
    return isLocalhost || isPrivateIPv4;
};
const isAllowedRedirectUri = (url) => getConfiguredRedirectOrigins().has(url.origin) ||
    isPrivateDevelopmentOrigin(url);
const getDefaultClientRedirectUri = () => {
    const configuredUrl = process.env.AUTH_SUCCESS_REDIRECT_URL;
    if (configuredUrl) {
        try {
            const url = new URL(configuredUrl);
            if (isAllowedRedirectUri(url)) {
                return url.toString();
            }
        }
        catch {
            return "http://localhost:3000/profile";
        }
    }
    return "http://localhost:3000/profile";
};
const getClientRedirectUri = (req) => {
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
    }
    catch {
        return getDefaultClientRedirectUri();
    }
};
const appendRedirectError = (redirectUri, error) => {
    const url = new URL(redirectUri);
    url.searchParams.set("auth_error", error);
    return url.toString();
};
const getRequestBaseUrl = (req) => {
    const configuredBaseUrl = process.env.AUTH_CALLBACK_BASE_URL || process.env.API_PUBLIC_BASE_URL;
    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/+$/, "");
    }
    const protocol = getFirstHeaderValue(req.headers["x-forwarded-proto"]) || req.protocol;
    const host = getFirstHeaderValue(req.headers["x-forwarded-host"]) || req.headers.host;
    return `${protocol}://${host}`;
};
const getProviderCallbackUrl = (req, provider) => new URL(`/auth/${provider}/callback`, getRequestBaseUrl(req)).toString();
const signState = (payload) => {
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = (0, crypto_1.createHmac)("sha256", (0, utils_1.getAuthSecret)())
        .update(encodedPayload)
        .digest();
    return `${encodedPayload}.${base64UrlEncode(signature)}`;
};
const parseState = (state) => {
    const [encodedPayload, encodedSignature] = state.split(".");
    if (!encodedPayload || !encodedSignature) {
        return null;
    }
    const expectedSignature = (0, crypto_1.createHmac)("sha256", (0, utils_1.getAuthSecret)())
        .update(encodedPayload)
        .digest();
    const receivedSignature = base64UrlDecode(encodedSignature);
    if (expectedSignature.length !== receivedSignature.length ||
        !(0, crypto_1.timingSafeEqual)(expectedSignature, receivedSignature)) {
        return null;
    }
    try {
        const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
        if ((payload.provider !== "google" && payload.provider !== "facebook") ||
            typeof payload.redirectUri !== "string" ||
            typeof payload.iat !== "number" ||
            typeof payload.nonce !== "string" ||
            Date.now() - payload.iat > stateMaxAgeMs) {
            return null;
        }
        const redirectUrl = new URL(payload.redirectUri);
        if (!isAllowedRedirectUri(redirectUrl)) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
};
const getOAuthConfig = (provider) => {
    if (provider === "google") {
        return {
            clientId: getEnvValue("GOOGLE_CLIENT_ID") ||
                getEnvValue("GOOGLE_OAUTH_CLIENT_ID"),
            clientSecret: getEnvValue("GOOGLE_CLIENT_SECRET") ||
                getEnvValue("GOOGLE_OAUTH_CLIENT_SECRET"),
        };
    }
    return {
        clientId: getEnvValue("FACEBOOK_APP_ID") || getEnvValue("FACEBOOK_CLIENT_ID"),
        clientSecret: getEnvValue("FACEBOOK_APP_SECRET") ||
            getEnvValue("FACEBOOK_CLIENT_SECRET"),
    };
};
const createProviderAuthUrl = (req, provider, config, redirectUri) => {
    const state = signState({
        provider,
        redirectUri,
        iat: Date.now(),
        nonce: (0, crypto_1.randomBytes)(16).toString("hex"),
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
    const facebookVersion = process.env.FACEBOOK_GRAPH_VERSION || "v20.0";
    const authUrl = new URL(`https://www.facebook.com/${facebookVersion}/dialog/oauth`);
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "email,public_profile");
    authUrl.searchParams.set("state", state);
    return authUrl.toString();
};
const exchangeGoogleCode = async (code, callbackUrl, config) => {
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
    const tokenData = (await tokenResponse.json());
    if (!tokenData.access_token) {
        throw new Error("Google access token missing.");
    }
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
        },
    });
    if (!userResponse.ok) {
        throw new Error("Google profile request failed.");
    }
    const profile = (await userResponse.json());
    if (!profile.sub || !profile.email || profile.email_verified === false) {
        throw new Error("Google profile is missing a verified email.");
    }
    const email = profile.email.trim().toLowerCase();
    const socialProfile = {
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
const exchangeFacebookCode = async (code, callbackUrl, config) => {
    var _a, _b;
    const facebookVersion = process.env.FACEBOOK_GRAPH_VERSION || "v20.0";
    const tokenUrl = new URL(`https://graph.facebook.com/${facebookVersion}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", config.clientId);
    tokenUrl.searchParams.set("client_secret", config.clientSecret);
    tokenUrl.searchParams.set("redirect_uri", callbackUrl);
    tokenUrl.searchParams.set("code", code);
    const tokenResponse = await fetch(tokenUrl);
    if (!tokenResponse.ok) {
        throw new Error("Facebook token exchange failed.");
    }
    const tokenData = (await tokenResponse.json());
    if (!tokenData.access_token) {
        throw new Error("Facebook access token missing.");
    }
    const profileUrl = new URL(`https://graph.facebook.com/${facebookVersion}/me`);
    profileUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
    profileUrl.searchParams.set("access_token", tokenData.access_token);
    const userResponse = await fetch(profileUrl);
    if (!userResponse.ok) {
        throw new Error("Facebook profile request failed.");
    }
    const profile = (await userResponse.json());
    if (!profile.id || !profile.email) {
        throw new Error("Facebook profile is missing an email.");
    }
    const email = profile.email.trim().toLowerCase();
    const socialProfile = {
        provider: "facebook",
        providerId: profile.id,
        email,
        name: normalizeDisplayName(profile.name, email),
    };
    if ((_b = (_a = profile.picture) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.url) {
        socialProfile.avatarUrl = profile.picture.data.url;
    }
    return socialProfile;
};
const normalizeDisplayName = (name, email) => {
    var _a;
    const trimmedName = name === null || name === void 0 ? void 0 : name.trim();
    if (trimmedName && trimmedName.length >= 3) {
        return trimmedName.slice(0, 100);
    }
    const emailName = (_a = email.split("@")[0]) === null || _a === void 0 ? void 0 : _a.replace(/[._-]+/g, " ").trim();
    if (emailName && emailName.length >= 3) {
        return emailName.slice(0, 100);
    }
    return "Utilizador Biishare";
};
const getProviderField = (provider) => provider === "google" ? "googleId" : "facebookId";
const findOrCreateSocialUser = async (profile) => {
    const providerField = getProviderField(profile.provider);
    let user = await app_1.default.findOne({ [providerField]: profile.providerId });
    if (!user) {
        user = await app_1.default.findOne({ email: profile.email });
    }
    if (user) {
        user.set(providerField, profile.providerId);
        if (!user.avatarUrl && profile.avatarUrl) {
            user.avatarUrl = profile.avatarUrl;
        }
        await user.save();
        return (0, utils_1.ensureUserUsername)(user);
    }
    const username = await (0, utils_1.createUniqueUsername)(profile.name || profile.email.split("@")[0] || profile.provider);
    const userPayload = {
        name: profile.name,
        username,
        email: profile.email,
        [providerField]: profile.providerId,
        ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    };
    return app_1.default.create(userPayload);
};
const startSocialAuth = (provider) => (req, res) => {
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
const handleSocialCallback = (provider) => async (req, res) => {
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
        const profile = provider === "google"
            ? await exchangeGoogleCode(code, callbackUrl, resolvedConfig)
            : await exchangeFacebookCode(code, callbackUrl, resolvedConfig);
        const user = await findOrCreateSocialUser(profile);
        (0, utils_1.setAuthCookie)(res, (0, utils_1.createAuthToken)(user));
        res.redirect(state.redirectUri);
    }
    catch (error) {
        console.error(error);
        res.redirect(appendRedirectError(state.redirectUri, "oauth_failed"));
    }
};
exports.googleAuth = startSocialAuth("google");
exports.googleCallback = handleSocialCallback("google");
exports.facebookAuth = startSocialAuth("facebook");
exports.facebookCallback = handleSocialCallback("facebook");
