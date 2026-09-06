"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markPostTranslationsStale = exports.hasTranslatablePostChanges = void 0;
const TRANSLATABLE_POST_FIELDS = [
    "title",
    "description",
    "playlistTitle",
    "videos",
    "documents",
    "images",
    "playlist",
];
const hasTranslatablePostChanges = (body) => TRANSLATABLE_POST_FIELDS.some(field => body[field] !== undefined);
exports.hasTranslatablePostChanges = hasTranslatablePostChanges;
const markPostTranslationsStale = (post) => {
    const currentVersion = Number(post.sourceVersion) || 1;
    post.sourceVersion = currentVersion + 1;
    if (!post.translations || post.translations.size === 0) {
        return;
    }
    const now = new Date();
    post.translations.forEach((translation) => {
        translation.status = "stale";
        translation.updatedAt = now;
    });
    post.markModified("translations");
};
exports.markPostTranslationsStale = markPostTranslationsStale;
