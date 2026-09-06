import { IPost } from "../../models/post/app";

const TRANSLATABLE_POST_FIELDS = [
  "title",
  "description",
  "playlistTitle",
  "videos",
  "documents",
  "images",
  "playlist",
] as const;

export const hasTranslatablePostChanges = (body: Record<string, unknown>) =>
  TRANSLATABLE_POST_FIELDS.some(field => body[field] !== undefined);

export const markPostTranslationsStale = (post: IPost): void => {
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