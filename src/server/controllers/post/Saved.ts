import { Request, Response } from "express";
import { Types } from "mongoose";

import { normalizeContentLocale, ContentLocale } from "../../i18n/locales";
import PostModel from "../../models/post/app";
import SavedPostModel from "../../models/savedPost/app";
import { toPostResponse } from "./Presenter";

const SAVED_POST_SELECT =
  "creatorId subjectId subjectIds title description level contentType imageLink playlistTitle playlistOrder videos documents images playlist isPublished originalLocale sourceVersion translations createdAt updatedAt";

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

const getPostId = (req: Request): string | null => {
  const postId = req.params.id;

  if (typeof postId !== "string" || !Types.ObjectId.isValid(postId)) {
    return null;
  }

  return postId;
};

type SavedPostPayloadSource = {
  _id: unknown;
  createdAt: Date;
};

const stringifyId = (id: unknown): string => {
  if (id instanceof Types.ObjectId) {
    return id.toString();
  }

  return typeof id === "string" ? id : String(id);
};

const buildSavedPostPayload = (
  savedPost: SavedPostPayloadSource,
  post: unknown,
  locale?: ContentLocale | null
) => ({
  id: stringifyId(savedPost._id),
  savedAt: savedPost.createdAt,
  post: toPostResponse(post, { locale }),
});

export const getSavedPosts = async (
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
    const locale = normalizeContentLocale(req.query.locale);
    const userObjectId = new Types.ObjectId(userId);

    const [savedPosts, total] = await Promise.all([
      SavedPostModel.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate({
          path: "postId",
          select: SAVED_POST_SELECT,
          populate: {
            path: "creatorId",
            select: "name username avatarUrl email",
          },
        })
        .lean(),
      SavedPostModel.countDocuments({ userId: userObjectId }),
    ]);

    const data = savedPosts
      .filter(savedPost => savedPost.postId)
      .map(savedPost =>
        buildSavedPostPayload(savedPost, savedPost.postId, locale)
      );

    res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch saved posts" });
  }
};

export const getSavedPostStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);
    const postId = getPostId(req);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!postId) {
      res.status(400).json({ error: "Invalid post id" });
      return;
    }

    const savedPost = await SavedPostModel.exists({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });

    res.status(200).json({ saved: Boolean(savedPost) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch saved post status" });
  }
};

export const savePost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);
    const postId = getPostId(req);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!postId) {
      res.status(400).json({ error: "Invalid post id" });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);
    const postObjectId = new Types.ObjectId(postId);
    const locale = normalizeContentLocale(req.query.locale);
    const post = await PostModel.findById(postObjectId).select(
      SAVED_POST_SELECT
    ).populate({
      path: "creatorId",
      select: "name username avatarUrl email",
    });

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const existingSavedPost = await SavedPostModel.findOne({
      userId: userObjectId,
      postId: postObjectId,
    });
    const savedPost =
      existingSavedPost ??
      (await SavedPostModel.create({
        userId: userObjectId,
        postId: postObjectId,
      }));

    res.status(200).json({
      saved: true,
      data: buildSavedPostPayload(savedPost, post, locale),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save post" });
  }
};

export const deleteSavedPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(res);
    const postId = getPostId(req);

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!postId) {
      res.status(400).json({ error: "Invalid post id" });
      return;
    }

    await SavedPostModel.deleteOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });

    res.status(200).json({ saved: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove saved post" });
  }
};