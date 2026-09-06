"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeContentLocale = exports.SUPPORTED_CONTENT_LOCALES = exports.DEFAULT_CONTENT_LOCALE = void 0;
exports.DEFAULT_CONTENT_LOCALE = "pt-MZ";
exports.SUPPORTED_CONTENT_LOCALES = [exports.DEFAULT_CONTENT_LOCALE, "en"];
const LOCALE_ALIASES = {
    "pt": "pt-MZ",
    "pt-mz": "pt-MZ",
    "pt-pt": "pt-MZ",
    "en": "en",
    "en-us": "en",
    "en-gb": "en",
};
const getStringValue = (value) => {
    const rawValue = Array.isArray(value) ? value[0] : value;
    return typeof rawValue === "string" ? rawValue : null;
};
const normalizeContentLocale = (value) => {
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
exports.normalizeContentLocale = normalizeContentLocale;
