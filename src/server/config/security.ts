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

export const isProduction = () => process.env.NODE_ENV === 'production';

export const splitCsv = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const getEnvValue = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  const duplicatedKeyPrefix = name + '=';

  if (value.startsWith(duplicatedKeyPrefix)) {
    return value.slice(duplicatedKeyPrefix.length).trim() || undefined;
  }

  return value;
};

export const getOrigin = (value: string): string | undefined => {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

export const getAllowedCorsOrigins = () => {
  const configuredOrigins = splitCsv(process.env.CORS_ORIGINS)
    .map(getOrigin)
    .filter((origin): origin is string => Boolean(origin));

  if (configuredOrigins.length > 0) {
    return Array.from(new Set(configuredOrigins));
  }

  return isProduction() ? [] : defaultLocalOrigins;
};

const isPrivateDevelopmentUrl = (url: URL) => {
  if (isProduction()) {
    return false;
  }

  const hostname = url.hostname.toLowerCase();

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
};

export const isAllowedOrigin = (
  value?: string,
  extraOrigins: Iterable<string> = []
) => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const allowedOrigins = new Set([
      ...getAllowedCorsOrigins(),
      ...Array.from(extraOrigins),
    ]);

    return allowedOrigins.has(url.origin) || isPrivateDevelopmentUrl(url);
  } catch {
    return false;
  }
};

export const getConfiguredRedirectOrigins = () => {
  const origins = [
    ...(isProduction() ? [] : defaultLocalOrigins),
    ...splitCsv(process.env.CORS_ORIGINS),
    ...splitCsv(process.env.AUTH_REDIRECT_ORIGINS),
  ];
  const successRedirectUrl = getEnvValue('AUTH_SUCCESS_REDIRECT_URL');

  if (successRedirectUrl) {
    origins.push(successRedirectUrl);
  }

  return new Set(origins.map(getOrigin).filter(Boolean) as string[]);
};

export const assertSecurityConfiguration = () => {
  const sameSite = (
    getEnvValue('AUTH_COOKIE_SAME_SITE') || 'lax'
  ).toLowerCase();
  const secureValue = getEnvValue('AUTH_COOKIE_SECURE');
  const cookieName = getEnvValue('AUTH_COOKIE_NAME') || 'biishare_session';
  const cookieDomain = getEnvValue('AUTH_COOKIE_DOMAIN');

  if (sameSite !== 'lax' && sameSite !== 'strict' && sameSite !== 'none') {
    throw new Error(
      'AUTH_COOKIE_SAME_SITE must be one of: lax, strict, none.'
    );
  }

  if (sameSite === 'none' && secureValue === 'false') {
    throw new Error('AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.');
  }

  if (cookieName.startsWith('__Host-') && cookieDomain) {
    throw new Error('__Host- cookies cannot use AUTH_COOKIE_DOMAIN.');
  }

  if (!isProduction()) {
    return;
  }

  const authSecret = getEnvValue('AUTH_TOKEN_SECRET');
  const allowedOrigins = getAllowedCorsOrigins();

  if (!authSecret || authSecret === 'change-me' || authSecret.length < 32) {
    throw new Error(
      'AUTH_TOKEN_SECRET must be set to a strong value with at least 32 characters in production.'
    );
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
