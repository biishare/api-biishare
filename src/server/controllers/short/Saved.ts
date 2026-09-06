import { Request, Response } from "express";
import { Types } from "mongoose";

import SavedToqueModel from "../../models/savedToque/app";
import ToqueModel from "../../models/shorts/app";
import { TOQUE_CREATOR_SELECT, toCreatorPreview } from "./Get";

const TOQUE_PREVIEW_SELECT =
  "creatorId area title description mediaType video image images isPublished createdAt updatedAt";

const parsePositiveInteger = (
  value: unknown,
  fallback: number,
  max?: number
): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  const normalized = Math.floor(parsed);
  return max ? Math.min(normalized, max) : normalized;
};

const getUserId = (res: Response): string | null => {
  const userId = res.locals.userId;

  if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
    return null;
  }

  return userId;
};

const getToqueId = (req: Request): string | null => {
  const toqueId = req.params.id;

  if (typeof toqueId !== "string" || !Types.ObjectId.isValid(toqueId)) {
    return null;
  }

  return toqueId;
};

type SavedToquePayloadSource = {
  _id: unknown;
  createdAt: Date;
};

type MediaPreviewSource = {
  url?: unknown;
};

const stringifyId = (id: unknown): string => {
  if (id instanceof Types.ObjectId) {
    return id.toString();
  }

  return typeof id === "string" ? id : String(id);
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asRequiredString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const getToqueImageUrls = (plainToque: Record<string, unknown>): string[] => {
  const images = Array.isArray(plainToque.images) ? plainToque.images : [];
  const image = plainToque.image as MediaPreviewSource | undefined;
  const urls = [
    ...images.map((item) => asOptionalString((item as MediaPreviewSource)?.url)),
    asOptionalString(image?.url),
  ];

  return Array.from(new Set(urls.filter((url): url is string => Boolean(url))));
};

export const toToquePreview = (toque: unknown): unknown => {
  if (!toque || typeof toque !== "object") {
    return toque;
  }

  const documentLikeToque = toque as {
    toObject?: () => Record<string, unknown>;
  };
  const plainToque =
    typeof documentLikeToque.toObject === "function"
      ? documentLikeToque.toObject()
      : (toque as Record<string, unknown>);

  const mediaType = plainToque.mediaType === "image" ? "image" : "video";
  const video = plainToque.video as MediaPreviewSource | undefined;
  const image = plainToque.image as MediaPreviewSource | undefined;
  const imageUrls = mediaType === "image" ? getToqueImageUrls(plainToque) : [];
  const videoPosterUrl = mediaType === "video" ? asOptionalString(image?.url) : undefined;
  const creator = toCreatorPreview(plainToque.creatorId);
  const rawCreatorId = plainToque.creatorId;
  const creatorId =
    creator?.id ??
    (rawCreatorId instanceof Types.ObjectId || typeof rawCreatorId === "string"
      ? stringifyId(rawCreatorId)
      : undefined);

  return {
    _id: stringifyId(plainToque._id),
    creatorId,
    creator,
    area: asRequiredString(plainToque.area),
    title: asRequiredString(plainToque.title),
    description: asRequiredString(plainToque.description),
    mediaType,
    videoUrl: mediaType === "video" ? asOptionalString(video?.url) : undefined,
    imageUrl: mediaType === "image" ? imageUrls[0] : videoPosterUrl,
    imageUrls: mediaType === "image" ? imageUrls : undefined,
    images: mediaType === "image" ? imageUrls.map((url) => ({ url })) : undefined,
    isPublished: Boolean(plainToque.isPublished),
    createdAt: plainToque.createdAt,
    updatedAt: plainToque.updatedAt,
  };
};

const buildSavedToquePayload = (
  savedToque: SavedToquePayloadSource,
  toque: unknown
) => ({
  id: stringifyId(savedToque._id),
  savedAt: savedToque.createdAt,
  toque: toToquePreview(toque),
});

export const getSavedToques = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const pageNumber = parsePositiveInteger(req.query.page, 1);
    const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
    const skip = (pageNumber - 1) * limitNumber;
    const userObjectId = new Types.ObjectId(userId);

    const [savedToques, total] = await Promise.all([
      SavedToqueModel.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate({
          path: "toqueId",
          select: TOQUE_PREVIEW_SELECT,
          populate: {
            path: "creatorId",
            select: TOQUE_CREATOR_SELECT,
          },
        })
        .lean(),
      SavedToqueModel.countDocuments({ userId: userObjectId }),
    ]);

    const data = savedToques
      .filter(savedToque => savedToque.toqueId)
      .map(savedToque => buildSavedToquePayload(savedToque, savedToque.toqueId));

    res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch saved toques" });
  }
};

export const getSavedToqueStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);
    const toqueId = getToqueId(req);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    const savedToque = await SavedToqueModel.exists({
      userId: new Types.ObjectId(userId),
      toqueId: new Types.ObjectId(toqueId),
    });

    res.status(200).json({ saved: Boolean(savedToque) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch saved toque status" });
  }
};

export const saveToque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);
    const toqueId = getToqueId(req);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);
    const toqueObjectId = new Types.ObjectId(toqueId);
    const toque = await ToqueModel.findById(toqueObjectId).select(
      TOQUE_PREVIEW_SELECT
    ).populate({
      path: "creatorId",
      select: TOQUE_CREATOR_SELECT,
    });

    if (!toque) {
      res.status(404).json({ error: "Toque not found" });
      return;
    }

    const existingSavedToque = await SavedToqueModel.findOne({
      userId: userObjectId,
      toqueId: toqueObjectId,
    });
    const savedToque =
      existingSavedToque ??
      (await SavedToqueModel.create({
        userId: userObjectId,
        toqueId: toqueObjectId,
      }));

    res.status(200).json({
      saved: true,
      data: buildSavedToquePayload(savedToque, toque),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save toque" });
  }
};

export const deleteSavedToque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);
    const toqueId = getToqueId(req);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    await SavedToqueModel.deleteOne({
      userId: new Types.ObjectId(userId),
      toqueId: new Types.ObjectId(toqueId),
    });

    res.status(200).json({ saved: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove saved toque" });
  }
};