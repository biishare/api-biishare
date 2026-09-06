import { Request, Response } from "express";

import {
  buildCreatorContentFilter,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import { normalizeContentLocale } from "../../i18n/locales";
import PostModel, { PostContentType } from "../../models/post/app";
import { toPostResponse } from "./Presenter";

const CREATOR_SELECT = "name username avatarUrl email";
const CONTENT_TYPES: PostContentType[] = ["video", "document", "image", "playlist"];

const ACCENT_FOLD: Record<string, string> = {
  a: "aáàâãäå",
  e: "eéèêë",
  i: "iíìîï",
  o: "oóòôõö",
  u: "uúùûü",
  c: "cç",
  n: "nñ",
};

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

const getQueryString = (value: unknown): string => {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue.replace(/\s+/g, " ").trim();
};

const normalizeSearchValue = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const escapeRegexChar = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchRegex = (value: unknown): RegExp | null => {
  const query = normalizeSearchValue(getQueryString(value));

  if (query.length < 2) {
    return null;
  }

  const pattern = Array.from(query)
    .map((char) => {
      if (/\s/.test(char)) {
        return "\\s+";
      }

      const variants = ACCENT_FOLD[char];
      return variants ? `[${variants}]` : escapeRegexChar(char);
    })
    .join("");

  return new RegExp(pattern, "i");
};

const buildPublicPostFilters = (req: Request): Record<string, unknown> => {
  const { subjectId, level, contentType, q } = req.query;
  const filters: Record<string, unknown> = { isPublished: { $ne: false } };
  const conditions: Record<string, unknown>[] = [];
  const subjectIdValue = getQueryString(subjectId);
  const levelValue = getQueryString(level);
  const searchRegex = buildSearchRegex(q);

  if (subjectIdValue) {
    conditions.push({ $or: [{ subjectIds: subjectIdValue }, { subjectId: subjectIdValue }] });
  }

  if (levelValue) {
    filters.level = levelValue;
  }

  if (typeof contentType === "string" && CONTENT_TYPES.includes(contentType as PostContentType)) {
    filters.contentType = contentType;
  }

  if (searchRegex) {
    conditions.push({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { level: searchRegex },
        { contentType: searchRegex },
        { subjectId: searchRegex },
        { subjectIds: searchRegex },
        { playlistTitle: searchRegex },
        { "videos.title": searchRegex },
        { "documents.title": searchRegex },
        { "images.title": searchRegex },
        { "playlist.title": searchRegex },
      ],
    });
  }

  if (conditions.length > 0) {
    filters.$and = conditions;
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
  const locale = normalizeContentLocale(req.query.locale);

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
    data: posts.map(post => toPostResponse(post, { locale })),
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