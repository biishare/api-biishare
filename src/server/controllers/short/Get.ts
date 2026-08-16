import { Request, Response } from "express";

import {
  buildCreatorContentFilter,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import ToqueModel from "../../models/shorts/app";

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

type MediaPreviewSource = {
  url?: unknown;
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getToqueImageUrls = (toque: any): string[] => {
  const images = Array.isArray(toque.images) ? toque.images : [];
  const urls: string[] = images
    .map((item: MediaPreviewSource) => asOptionalString(item?.url))
    .filter((url: string | undefined): url is string => Boolean(url));
  const legacyUrl = asOptionalString(toque.image?.url);

  return Array.from(
    new Set(
      [...urls, legacyUrl].filter(
        (url: string | undefined): url is string => Boolean(url)
      )
    )
  );
};

const toToqueResponse = (toque: any) => {
  const mediaType = toque.mediaType === "image" ? "image" : "video";
  const imageUrls = mediaType === "image" ? getToqueImageUrls(toque) : [];

  return {
    _id: toque._id,
    creatorId: toque.creatorId,
    area: toque.area,
    title: toque.title,
    description: toque.description,
    mediaType,
    videoUrl: mediaType === "video" ? toque.video?.url : undefined,
    imageUrl: mediaType === "image" ? imageUrls[0] : undefined,
    imageUrls: mediaType === "image" ? imageUrls : undefined,
    images: mediaType === "image" ? imageUrls.map((url) => ({ url })) : undefined,
    isPublished: toque.isPublished,
    createdAt: toque.createdAt,
    updatedAt: toque.updatedAt,
  };
};

const sendToquePage = async (
  req: Request,
  res: Response,
  filters: Record<string, unknown>
): Promise<void> => {
  const pageNumber = parsePositiveInteger(req.query.page, 1);
  const limitNumber = parsePositiveInteger(req.query.limit, 10, 50);
  const skip = (pageNumber - 1) * limitNumber;

  const [shorts, total] = await Promise.all([
    ToqueModel.find(filters as any)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    ToqueModel.countDocuments(filters as any),
  ]);

  res.status(200).json({
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages: Math.ceil(total / limitNumber),
    data: shorts.map(toToqueResponse),
  });
};

export const getShorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { area } = req.query;
    const filters: Record<string, unknown> = { isPublished: { $ne: false } };

    if (area && area !== "todos") {
      filters.area = area.toString().toLowerCase();
    }

    await sendToquePage(req, res, filters);
  } catch (error) {
    console.error("Erro ao buscar shorts:", error);
    res.status(500).json({
      error: "Failed to fetch shorts",
    });
  }
};

export const getMyToques = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const owner = await getAuthenticatedContentOwner(res);

    if (!owner) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    await sendToquePage(req, res, buildCreatorContentFilter(owner));
  } catch (error) {
    console.error("Erro ao buscar toques do criador:", error);
    res.status(500).json({
      error: "Failed to fetch creator toques",
    });
  }
};