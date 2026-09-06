export const DEFAULT_CONTENT_LOCALE = "pt-MZ" as const;
export const SUPPORTED_CONTENT_LOCALES = [DEFAULT_CONTENT_LOCALE, "en"] as const;

export type ContentLocale = (typeof SUPPORTED_CONTENT_LOCALES)[number];

const LOCALE_ALIASES: Record<string, ContentLocale> = {
  "pt": "pt-MZ",
  "pt-mz": "pt-MZ",
  "pt-pt": "pt-MZ",
  "en": "en",
  "en-us": "en",
  "en-gb": "en",
};

const getStringValue = (value: unknown): string | null => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return typeof rawValue === "string" ? rawValue : null;
};

export const normalizeContentLocale = (value: unknown): ContentLocale | null => {
  const rawValue = getStringValue(value);

  if (!rawValue) {
    return null;
  }

  const normalized = rawValue.trim().toLowerCase().replace("_", "-");
  const alias = LOCALE_ALIASES[normalized];

  if (alias) {
    return alias;
  }

  if (normalized.startsWith("pt-")) {
    return "pt-MZ";
  }

  if (normalized.startsWith("en-")) {
    return "en";
  }

  return null;
};