import { Types } from "mongoose";

import { legacyCreator } from "../../config/legacyCreator";

type PlainRecord = Record<string, unknown>;

type CreatorSummary = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
};

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

export const toPostResponse = (post: unknown): PlainRecord => {
  const plainPost = toPlainRecord(post);
  const creatorId = stringifyId(plainPost.creatorId);
  const creator = toCreatorSummary(plainPost.creatorId);

  return {
    ...plainPost,
    _id: stringifyId(plainPost._id),
    creatorId,
    creator: creator ?? (!creatorId ? getLegacyCreatorSummary() : undefined),
  };
};