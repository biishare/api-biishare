import { Request, Response } from "express";
import { Types } from "mongoose";

import PostCommentModel from "../../models/postComment/app";
import PostModel from "../../models/post/app";

const COMMENT_AUTHOR_SELECT = "name username avatarUrl";

const parsePositiveInteger = (
  value: unknown,
  fallback: number,
  max?: number
): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  const normalized = Math.floor(parsed);
  return max ? Math.min(normalized, max) : normalized;
};

const getPostObjectId = (req: Request): Types.ObjectId | null => {
  const postId = req.params.id;

  return typeof postId === "string" && Types.ObjectId.isValid(postId)
    ? new Types.ObjectId(postId)
    : null;
};

const getRequiredUserObjectId = (res: Response): Types.ObjectId | null => {
  const userId = res.locals.userId;

  return typeof userId === "string" && Types.ObjectId.isValid(userId)
    ? new Types.ObjectId(userId)
    : null;
};

const ensurePublishedPostExists = (postId: Types.ObjectId) =>
  PostModel.exists({ _id: postId, isPublished: { $ne: false } });

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const stringifyId = (value: unknown): string => {
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === "string") return value;
  return value == null ? "" : String(value);
};

type LeanAuthor = {
  _id?: unknown;
  name?: unknown;
  username?: unknown;
  avatarUrl?: unknown;
};

type LeanComment = {
  _id?: unknown;
  text?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  userId?: unknown;
};

const asAuthor = (value: unknown): LeanAuthor => {
  if (!value || typeof value !== "object" || value instanceof Types.ObjectId) return {};
  return value as LeanAuthor;
};

const toCommentResponse = (comment: LeanComment) => {
  const author = asAuthor(comment.userId);

  return {
    id: stringifyId(comment._id),
    text: asString(comment.text),
    author: {
      id: stringifyId(author._id),
      name: asString(author.name, "Utilizador Biishare"),
      username: asString(author.username) || undefined,
      avatarUrl: asString(author.avatarUrl) || undefined,
    },
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
};

export const getPostComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = getPostObjectId(req);

    if (!postId) {
      res.status(400).json({ error: "Invalid post id" });
      return;
    }

    if (!(await ensurePublishedPostExists(postId))) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 50);
    const filters: { postId: Types.ObjectId; status: "visible" } = {
      postId,
      status: "visible",
    };

    const [comments, total] = await Promise.all([
      PostCommentModel.find(filters)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "userId", select: COMMENT_AUTHOR_SELECT })
        .lean(),
      PostCommentModel.countDocuments(filters),
    ]);

    res.status(200).json({
      data: comments.map((comment) => toCommentResponse(comment as LeanComment)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch post comments" });
  }
};

export const createPostComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = getPostObjectId(req);
    const userId = getRequiredUserObjectId(res);
    const text = asString(req.body?.text).replace(/\s+/g, " ").trim();

    if (!postId) {
      res.status(400).json({ error: "Invalid post id" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (text.length < 1 || text.length > 500) {
      res.status(400).json({ error: "Comentario invalido." });
      return;
    }

    if (!(await ensurePublishedPostExists(postId))) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const comment = await PostCommentModel.create({ postId, userId, text, status: "visible" });
    const populated = await comment.populate({
      path: "userId",
      select: COMMENT_AUTHOR_SELECT,
    });
    const total = await PostCommentModel.countDocuments({ postId, status: "visible" });

    res.status(201).json({
      data: toCommentResponse(populated.toObject() as LeanComment),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create post comment" });
  }
};
