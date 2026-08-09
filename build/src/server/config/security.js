"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSecurityConfiguration = exports.getConfiguredRedirectOrigins = exports.isAllowedOrigin = exports.getAllowedCorsOrigins = exports.getOrigin = exports.getEnvValue = exports.splitCsv = exports.isProduction = void 0;
const defaultLocalOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3004',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:3006',
    'http://127.0.0.1:3007',
];
const isProduction = () => process.env.NODE_ENV === 'production';
exports.isProduction = isProduction;
const splitCsv = (value) => (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
exports.splitCsv = splitCsv;
const getEnvValue = (name) => {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value) {
        return undefined;
    }
    const duplicatedKeyPrefix = name + '=';
    if (value.startsWith(duplicatedKeyPrefix)) {
        return value.slice(duplicatedKeyPrefix.length).trim() || undefined;
    }
    return value;
};
exports.getEnvValue = getEnvValue;
const getOrigin = (value) => {
    try {
        return new URL(value).origin;
    }
    catch {
        return undefined;
    }
};
exports.getOrigin = getOrigin;
const getAllowedCorsOrigins = () => {
    const configuredOrigins = (0, exports.splitCsv)(process.env.CORS_ORIGINS)
        .map(exports.getOrigin)
        .filter((origin) => Boolean(origin));
    if (configuredOrigins.length > 0) {
        return Array.from(new Set(configuredOrigins));
    }
    return (0, exports.isProduction)() ? [] : defaultLocalOrigins;
};
exports.getAllowedCorsOrigins = getAllowedCorsOrigins;
const isPrivateDevelopmentUrl = (url) => {
    if ((0, exports.isProduction)()) {
        return false;
    }
    const hostname = url.hostname.toLowerCase();
    return (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname));
};
const isAllowedOrigin = (value, extraOrigins = []) => {
    if (!value) {
        return false;
    }
    try {
        const url = new URL(value);
        const allowedOrigins = new Set([
            ...(0, exports.getAllowedCorsOrigins)(),
            ...Array.from(extraOrigins),
        ]);
        return allowedOrigins.has(url.origin) || isPrivateDevelopmentUrl(url);
    }
    catch {
        return false;
    }
};
exports.isAllowedOrigin = isAllowedOrigin;
const getConfiguredRedirectOrigins = () => {
    const origins = [
        ...((0, exports.isProduction)() ? [] : defaultLocalOrigins),
        ...(0, exports.splitCsv)(process.env.CORS_ORIGINS),
        ...(0, exports.splitCsv)(process.env.AUTH_REDIRECT_ORIGINS),
    ];
    const successRedirectUrl = (0, exports.getEnvValue)('AUTH_SUCCESS_REDIRECT_URL');
    if (successRedirectUrl) {
        origins.push(successRedirectUrl);
    }
    return new Set(origins.map(exports.getOrigin).filter(Boolean));
};
exports.getConfiguredRedirectOrigins = getConfiguredRedirectOrigins;
const assertSecurityConfiguration = () => {
    const sameSite = ((0, exports.getEnvValue)('AUTH_COOKIE_SAME_SITE') || 'lax').toLowerCase();
    const secureValue = (0, exports.getEnvValue)('AUTH_COOKIE_SECURE');
    const cookieName = (0, exports.getEnvValue)('AUTH_COOKIE_NAME') || 'biishare_session';
    const cookieDomain = (0, exports.getEnvValue)('AUTH_COOKIE_DOMAIN');
    if (sameSite !== 'lax' && sameSite !== 'strict' && sameSite !== 'none') {
        throw new Error('AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.');
    }
    if (sameSite === 'none' && secureValue === 'false') {
        throw new Error('AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.');
    }
    if (cookieName.startsWith('__Host-') && cookieDomain) {
        throw new Error('__Host- cookies cannot use AUTH_COOKIE_DOMAIN.');
    }
    if (!(0, exports.isProduction)()) {
        return;
    }
    const authSecret = (0, exports.getEnvValue)('AUTH_TOKEN_SECRET');
    const allowedOrigins = (0, exports.getAllowedCorsOrigins)();
    if (!authSecret || authSecret === 'change-me' || authSecret.length < 32) {
        throw new Error('AUTH_TOKEN_SECRET must be set to a strong value with at least 32 characters in production.');
    }
    if (allowedOrigins.length === 0) {
        throw new Error('CORS_ORIGINS must include the production frontend origin.');
    }
    if (secureValue === 'false') {
        throw new Error('AUTH_COOKIE_SECURE must not be false in production.');
    }
    for (const origin of allowedOrigins) {
        if (!origin.startsWith('https://')) {
            throw new Error('Production CORS_ORIGINS must use HTTPS origins.');
        }
    }
};
exports.assertSecurityConfiguration = assertSecurityConfiguration;
