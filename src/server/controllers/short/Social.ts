import { Request, Response } from "express";
import { Types } from "mongoose";

import ToqueModel from "../../models/shorts/app";
import ToqueLikeModel from "../../models/toqueLike/app";
import ToqueCommentModel from "../../models/toqueComment/app";
import {
  getAuthTokenFromCookieHeader,
  verifyAuthToken,
} from "../auth/utils";

const COMMENT_AUTHOR_SELECT = "name username avatarUrl";

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

const stringifyId = (id: unknown): string => {
  if (id instanceof Types.ObjectId) {
    return id.toString();
  }

  return typeof id === "string" ? id : String(id);
};

const getToqueObjectId = (req: Request): Types.ObjectId | null => {
  const toqueId = req.params.id;

  if (typeof toqueId !== "string" || !Types.ObjectId.isValid(toqueId)) {
    return null;
  }

  return new Types.ObjectId(toqueId);
};

const getRequiredUserObjectId = (res: Response): Types.ObjectId | null => {
  const userId = res.locals.userId;

  if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new Types.ObjectId(userId);
};

const getOptionalUserObjectId = (req: Request): Types.ObjectId | null => {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearerToken || getAuthTokenFromCookieHeader(req.headers.cookie);

  if (!token) {
    return null;
  }

  const session = verifyAuthToken(token);

  if (!session || !Types.ObjectId.isValid(session.userId)) {
    return null;
  }

  return new Types.ObjectId(session.userId);
};

const ensureToqueExists = async (toqueId: Types.ObjectId) => {
  return ToqueModel.exists({
    _id: toqueId,
    isPublished: { $ne: false },
  });
};

const buildSocialSummary = async (
  toqueId: Types.ObjectId,
  userId: Types.ObjectId | null
) => {
  const [likes, comments, liked] = await Promise.all([
    ToqueLikeModel.countDocuments({ toqueId }),
    ToqueCommentModel.countDocuments({ toqueId, status: "visible" }),
    userId ? ToqueLikeModel.exists({ toqueId, userId }) : Promise.resolve(null),
  ]);

  return {
    liked: Boolean(liked),
    likes,
    comments,
  };
};

const asString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

type LeanComment = {
  _id?: unknown;
  text?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  userId?: unknown;
};

type LeanAuthor = {
  _id?: unknown;
  name?: unknown;
  username?: unknown;
  avatarUrl?: unknown;
};

const asAuthor = (value: unknown): LeanAuthor => {
  if (!value || typeof value !== "object" || value instanceof Types.ObjectId) {
    return {};
  }

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

export const getToqueSocialSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const toqueId = getToqueObjectId(req);

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    const toqueExists = await ensureToqueExists(toqueId);

    if (!toqueExists) {
      res.status(404).json({ error: "Toque not found" });
      return;
    }

    res.status(200).json(
      await buildSocialSummary(toqueId, getOptionalUserObjectId(req))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch toque social summary" });
  }
};

export const likeToque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const toqueId = getToqueObjectId(req);
    const userId = getRequiredUserObjectId(res);

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const toqueExists = await ensureToqueExists(toqueId);

    if (!toqueExists) {
      res.status(404).json({ error: "Toque not found" });
      return;
    }

    await ToqueLikeModel.updateOne(
      { toqueId, userId },
      { $setOnInsert: { toqueId, userId } },
      { upsert: true }
    );

    res.status(200).json(await buildSocialSummary(toqueId, userId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to like toque" });
  }
};

export const unlikeToque = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const toqueId = getToqueObjectId(req);
    const userId = getRequiredUserObjectId(res);

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    await ToqueLikeModel.deleteOne({ toqueId, userId });

    res.status(200).json(await buildSocialSummary(toqueId, userId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to unlike toque" });
  }
};

export const getToqueComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const toqueId = getToqueObjectId(req);

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    const toqueExists = await ensureToqueExists(toqueId);

    if (!toqueExists) {
      res.status(404).json({ error: "Toque not found" });
      return;
    }

    const pageNumber = parsePositiveInteger(req.query.page, 1);
    const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
    const skip = (pageNumber - 1) * limitNumber;
    const filters: { toqueId: Types.ObjectId; status: "visible" } = { toqueId, status: "visible" };

    const [comments, total] = await Promise.all([
      ToqueCommentModel.find(filters)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate({ path: "userId", select: COMMENT_AUTHOR_SELECT })
        .lean(),
      ToqueCommentModel.countDocuments(filters),
    ]);

    res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data: comments.map((comment) => toCommentResponse(comment as LeanComment)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch toque comments" });
  }
};

export const createToqueComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const toqueId = getToqueObjectId(req);
    const userId = getRequiredUserObjectId(res);
    const text = asString(req.body?.text).replace(/\s+/g, " ").trim();

    if (!toqueId) {
      res.status(400).json({ error: "Invalid toque id" });
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

    const toqueExists = await ensureToqueExists(toqueId);

    if (!toqueExists) {
      res.status(404).json({ error: "Toque not found" });
      return;
    }

    const comment = await ToqueCommentModel.create({
      toqueId,
      userId,
      text,
      status: "visible",
    });
    const populated = await comment.populate({
      path: "userId",
      select: COMMENT_AUTHOR_SELECT,
    });
    const total = await ToqueCommentModel.countDocuments({
      toqueId,
      status: "visible",
    });

    res.status(201).json({
      data: toCommentResponse(populated.toObject() as LeanComment),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create toque comment" });
  }
};