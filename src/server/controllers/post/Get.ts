import { Request, Response } from "express";

import {
  buildCreatorContentFilter,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import PostModel, { PostContentType } from "../../models/post/app";
import { toPostResponse } from "./Presenter";

const CREATOR_SELECT = "name username avatarUrl email";
const CONTENT_TYPES: PostContentType[] = ["video", "document", "image", "playlist"];

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

const buildPublicPostFilters = (req: Request): Record<string, unknown> => {
  const { subjectId, level, contentType } = req.query;
  const filters: Record<string, unknown> = { isPublished: { $ne: false } };

  if (subjectId) {
    filters.$or = [{ subjectIds: subjectId }, { subjectId }];
  }

  if (level) {
    filters.level = level;
  }

  if (typeof contentType === "string" && CONTENT_TYPES.includes(contentType as PostContentType)) {
    filters.contentType = contentType;
  }

  return filters;
};

const sendPostPage = async (
  req: Request,
  res: Response,
  filters: Record<string, unknown>
): Promise<void> => {
  const pageNumber = parsePositiveInteger(req.query.page, 1);
  const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
  const skip = (pageNumber - 1) * limitNumber;

  const [posts, total] = await Promise.all([
    PostModel.find(filters)
      .populate({ path: "creatorId", select: CREATOR_SELECT })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    PostModel.countDocuments(filters),
  ]);

  res.status(200).json({
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages: Math.ceil(total / limitNumber),
    data: posts.map(toPostResponse),
  });
};

export const getPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await sendPostPage(req, res, buildPublicPostFilters(req));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch posts",
    });
  }
};

export const getMyPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const owner = await getAuthenticatedContentOwner(res);

    if (!owner) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    await sendPostPage(req, res, buildCreatorContentFilter(owner));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch creator posts",
    });
  }
};
