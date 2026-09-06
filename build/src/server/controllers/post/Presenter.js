"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPostResponse = void 0;
const mongoose_1 = require("mongoose");
const locales_1 = require("../../i18n/locales");
const legacyCreator_1 = require("../../config/legacyCreator");
const TRANSLATION_STATUSES = ["machine", "reviewed", "stale"];
const toPlainRecord = (value) => {
    if (!value || typeof value !== "object") {
        return {};
    }
    const maybeDocument = value;
    if (typeof maybeDocument.toObject === "function") {
        return maybeDocument.toObject();
    }
    return value;
};
const stringifyId = (value) => {
    if (!value) {
        return undefined;
    }
    if (value instanceof mongoose_1.Types.ObjectId) {
        return value.toString();
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "object" && "_id" in value) {
        return stringifyId(value._id);
    }
    return String(value);
};
const asOptionalString = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const asPositiveInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
};
const toCreatorSummary = (value) => {
    if (!value || value instanceof mongoose_1.Types.ObjectId || typeof value === "string") {
        return undefined;
    }
    const creator = toPlainRecord(value);
    const id = stringifyId(creator._id);
    const name = asOptionalString(creator.name);
    if (!id || !name) {
        return undefined;
    }
    const summary = { id, name };
    const username = asOptionalString(creator.username);
    const avatarUrl = asOptionalString(creator.avatarUrl);
    const email = asOptionalString(creator.email);
    if (username) {
        summary.username = username;
    }
    if (avatarUrl) {
        summary.avatarUrl = avatarUrl;
    }
    if (email) {
        summary.email = email;
    }
    return summary;
};
const getLegacyCreatorSummary = () => ({
    id: "legacy-saber-academico",
    name: legacyCreator_1.legacyCreator.name,
    username: legacyCreator_1.legacyCreator.username,
    email: legacyCreator_1.legacyCreator.email,
});
const getTranslationStatus = (value) => {
    if (typeof value !== "string") {
        return null;
    }
    return TRANSLATION_STATUSES.includes(value)
        ? value
        : null;
};
const getTranslationRecord = (plainPost, locale) => {
    const translations = plainPost.translations;
    if (!translations || typeof translations !== "object") {
        return null;
    }
    const translation = translations instanceof Map
        ? translations.get(locale)
        : translations[locale];
    return translation ? toPlainRecord(translation) : null;
};
const mergeTranslatedMedia = (originalValue, translatedValue) => {
    if (!Array.isArray(originalValue) || !Array.isArray(translatedValue)) {
        return originalValue;
    }
    return originalValue.map((item, index) => {
        const translation = toPlainRecord(translatedValue[index]);
        const translatedTitle = asOptionalString(translation.title);
        if (!translatedTitle) {
            return item;
        }
        return {
            ...toPlainRecord(item),
            title: translatedTitle,
        };
    });
};
const resolvePostTranslation = (plainPost, requestedLocale) => {
    var _a, _b;
    const originalLocale = (_a = (0, locales_1.normalizeContentLocale)(plainPost.originalLocale)) !== null && _a !== void 0 ? _a : locales_1.DEFAULT_CONTENT_LOCALE;
    const sourceVersion = asPositiveInteger(plainPost.sourceVersion, 1);
    const targetLocale = requestedLocale !== null && requestedLocale !== void 0 ? requestedLocale : originalLocale;
    if (targetLocale === originalLocale) {
        return {
            fields: {},
            originalLocale,
            resolvedLocale: originalLocale,
            sourceVersion,
            translationStatus: "original",
            isFallback: false,
        };
    }
    const translation = getTranslationRecord(plainPost, targetLocale);
    if (!translation) {
        return {
            fields: {},
            originalLocale,
            resolvedLocale: originalLocale,
            sourceVersion,
            translationStatus: "missing",
            isFallback: true,
        };
    }
    const status = (_b = getTranslationStatus(translation.status)) !== null && _b !== void 0 ? _b : "stale";
    const translationSourceVersion = asPositiveInteger(translation.sourceVersion, 0);
    const canUseTranslation = (status === "machine" || status === "reviewed") &&
        translationSourceVersion === sourceVersion;
    if (!canUseTranslation) {
        return {
            fields: {},
            originalLocale,
            resolvedLocale: originalLocale,
            sourceVersion,
            translationStatus: "stale",
            isFallback: true,
        };
    }
    const fields = {};
    const translatedTitle = asOptionalString(translation.title);
    const translatedDescription = asOptionalString(translation.description);
    const translatedPlaylistTitle = asOptionalString(translation.playlistTitle);
    if (translatedTitle) {
        fields.title = translatedTitle;
    }
    if (translatedDescription) {
        fields.description = translatedDescription;
    }
    if (translatedPlaylistTitle) {
        fields.playlistTitle = translatedPlaylistTitle;
    }
    for (const mediaKey of ["videos", "documents", "images", "playlist"]) {
        const translatedMedia = mergeTranslatedMedia(plainPost[mediaKey], translation[mediaKey]);
        if (translatedMedia !== plainPost[mediaKey]) {
            fields[mediaKey] = translatedMedia;
        }
    }
    return {
        fields,
        originalLocale,
        resolvedLocale: targetLocale,
        sourceVersion,
        translationStatus: status,
        isFallback: false,
    };
};
const toPostResponse = (post, options = {}) => {
    const plainPost = toPlainRecord(post);
    const creatorId = stringifyId(plainPost.creatorId);
    const creator = toCreatorSummary(plainPost.creatorId);
    const responseBase = { ...plainPost };
    const translation = resolvePostTranslation(plainPost, options.locale);
    delete responseBase.translations;
    return {
        ...responseBase,
        ...translation.fields,
        _id: stringifyId(plainPost._id),
        creatorId,
        creator: creator !== null && creator !== void 0 ? creator : (!creatorId ? getLegacyCreatorSummary() : undefined),
        originalLocale: translation.originalLocale,
        resolvedLocale: translation.resolvedLocale,
        sourceVersion: translation.sourceVersion,
        translationStatus: translation.translationStatus,
        isFallback: translation.isFallback,
    };
};
exports.toPostResponse = toPostResponse;
