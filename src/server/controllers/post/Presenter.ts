import { Types } from "mongoose";

import {
  ContentLocale,
  DEFAULT_CONTENT_LOCALE,
  normalizeContentLocale,
} from "../../i18n/locales";
import { legacyCreator } from "../../config/legacyCreator";
import { TranslationStatus } from "../../models/post/app";

type PlainRecord = Record<string, unknown>;
type PublicTranslationStatus = TranslationStatus | "original" | "missing";

type CreatorSummary = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
};

type PostResponseOptions = {
  locale?: ContentLocale | null | undefined;
};

const TRANSLATION_STATUSES: TranslationStatus[] = ["machine", "reviewed", "stale"];

const toPlainRecord = (value: unknown): PlainRecord => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const maybeDocument = value as { toObject?: () => PlainRecord };

  if (typeof maybeDocument.toObject === "function") {
    return maybeDocument.toObject();
  }

  return value as PlainRecord;
};

const stringifyId = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "_id" in value) {
    return stringifyId((value as { _id?: unknown })._id);
  }

  return String(value);
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asPositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
};

const toCreatorSummary = (value: unknown): CreatorSummary | undefined => {
  if (!value || value instanceof Types.ObjectId || typeof value === "string") {
    return undefined;
  }

  const creator = toPlainRecord(value);
  const id = stringifyId(creator._id);
  const name = asOptionalString(creator.name);

  if (!id || !name) {
    return undefined;
  }

  const summary: CreatorSummary = { id, name };
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

const getLegacyCreatorSummary = (): CreatorSummary => ({
  id: "legacy-saber-academico",
  name: legacyCreator.name,
  username: legacyCreator.username,
  email: legacyCreator.email,
});

const getTranslationStatus = (value: unknown): TranslationStatus | null => {
  if (typeof value !== "string") {
    return null;
  }

  return TRANSLATION_STATUSES.includes(value as TranslationStatus)
    ? value as TranslationStatus
    : null;
};

const getTranslationRecord = (
  plainPost: PlainRecord,
  locale: ContentLocale
): PlainRecord | null => {
  const translations = plainPost.translations;

  if (!translations || typeof translations !== "object") {
    return null;
  }

  const translation = translations instanceof Map
    ? translations.get(locale)
    : (translations as Record<string, unknown>)[locale];

  return translation ? toPlainRecord(translation) : null;
};

const mergeTranslatedMedia = (
  originalValue: unknown,
  translatedValue: unknown
) => {
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

const resolvePostTranslation = (
  plainPost: PlainRecord,
  requestedLocale?: ContentLocale | null
): {
  fields: PlainRecord;
  originalLocale: ContentLocale;
  resolvedLocale: ContentLocale;
  sourceVersion: number;
  translationStatus: PublicTranslationStatus;
  isFallback: boolean;
} => {
  const originalLocale = normalizeContentLocale(plainPost.originalLocale) ?? DEFAULT_CONTENT_LOCALE;
  const sourceVersion = asPositiveInteger(plainPost.sourceVersion, 1);
  const targetLocale = requestedLocale ?? originalLocale;

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

  const status = getTranslationStatus(translation.status) ?? "stale";
  const translationSourceVersion = asPositiveInteger(translation.sourceVersion, 0);
  const canUseTranslation =
    (status === "machine" || status === "reviewed") &&
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

  const fields: PlainRecord = {};
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

  for (const mediaKey of ["videos", "documents", "images", "playlist"] as const) {
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

export const toPostResponse = (
  post: unknown,
  options: PostResponseOptions = {}
): PlainRecord => {
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
    creator: creator ?? (!creatorId ? getLegacyCreatorSummary() : undefined),
    originalLocale: translation.originalLocale,
    resolvedLocale: translation.resolvedLocale,
    sourceVersion: translation.sourceVersion,
    translationStatus: translation.translationStatus,
    isFallback: translation.isFallback,
  };
};