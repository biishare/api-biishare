import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  buildCreatorContentFilter,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import ToqueModel, { ToqueDocument } from "../../models/shorts/app";

export const TOQUE_CREATOR_SELECT = "name username avatarUrl";

const ACCENT_FOLD: Record<string, string> = {
  a: "aáàâãäå",
  e: "eéèêë",
  i: "iíìîï",
  o: "oóòôõö",
  u: "uúùûü",
  c: "cç",
  n: "nñ",
};

export const TOQUE_SORT = { createdAt: -1, _id: -1 } as const;

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

const getToqueImageUrls = (toque: ToqueDocument): string[] => {
  const urls = (toque.images ?? [])
    .map((item) => item.url?.trim())
    .filter((url): url is string => Boolean(url));
  const legacyUrl = toque.image?.url?.trim();

  return Array.from(
    new Set(
      [...urls, legacyUrl].filter(
        (url): url is string => Boolean(url)
      )
    )
  );
};

const stringifyId = (id: unknown): string => {
  if (id instanceof Types.ObjectId) {
    return id.toString();
  }

  return typeof id === "string" ? id : String(id);
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const toCreatorPreview = (creatorValue: unknown) => {
  if (
    !creatorValue ||
    creatorValue instanceof Types.ObjectId ||
    typeof creatorValue !== "object"
  ) {
    return undefined;
  }

  const documentLikeCreator = creatorValue as {
    toObject?: () => Record<string, unknown>;
  };
  const creator =
    typeof documentLikeCreator.toObject === "function"
      ? documentLikeCreator.toObject()
      : (creatorValue as Record<string, unknown>);
  const name = asOptionalString(creator.name);

  if (!name) {
    return undefined;
  }

  return {
    id: stringifyId(creator._id),
    name,
    username: asOptionalString(creator.username),
    avatarUrl: asOptionalString(creator.avatarUrl),
  };
};
export const toToqueResponse = (toque: ToqueDocument) => {
  const mediaType = toque.mediaType === "image" ? "image" : "video";
  const imageUrls = mediaType === "image" ? getToqueImageUrls(toque) : [];
  const videoPosterUrl = mediaType === "video" ? toque.image?.url : undefined;
  const creator = toCreatorPreview((toque as { creatorId?: unknown }).creatorId);

  return {
    _id: toque._id,
    creatorId: creator?.id ?? (toque.creatorId ? toque.creatorId.toString() : undefined),
    creator,
    area: toque.area,
    title: toque.title,
    description: toque.description,
    mediaType,
    videoUrl: mediaType === "video" ? toque.video?.url : undefined,
    imageUrl: mediaType === "image" ? imageUrls[0] : videoPosterUrl,
    imageUrls: mediaType === "image" ? imageUrls : undefined,
    images: mediaType === "image" ? imageUrls.map((url) => ({ url })) : undefined,
    isPublished: toque.isPublished,
    createdAt: toque.createdAt,
    updatedAt: toque.updatedAt,
  };
};

const buildToqueCursor = (toque?: ToqueDocument) => {
  if (!toque) return undefined;

  return {
    id: toque._id.toString(),
    createdAt: toque.createdAt,
  };
};

const buildCursorFilter = (
  createdAtValue: unknown,
  idValue: unknown,
  directionValue: unknown
): Record<string, unknown> | null => {
  const createdAt = new Date(getQueryString(createdAtValue));
  const id = getQueryString(idValue);

  if (!Number.isFinite(createdAt.getTime()) || !Types.ObjectId.isValid(id)) {
    return null;
  }

  const objectId = new Types.ObjectId(id);
  const direction = getQueryString(directionValue) === "before" ? "before" : "after";

  if (direction === "before") {
    return {
      $or: [
        { createdAt: { $gt: createdAt } },
        { createdAt, _id: { $gt: objectId } },
      ],
    };
  }

  return {
    $or: [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: objectId } },
    ],
  };
};

const sendCursorPage = async (
  res: Response,
  filters: Record<string, unknown>,
  cursorFilter: Record<string, unknown>,
  limitNumber: number
): Promise<void> => {
  const queryFilter = { $and: [filters, cursorFilter] };

  const [shortsWithExtra, total] = await Promise.all([
    ToqueModel.find(queryFilter)
      .sort(TOQUE_SORT)
      .limit(limitNumber + 1)
      .populate({ path: "creatorId", select: TOQUE_CREATOR_SELECT }),
    ToqueModel.countDocuments(filters),
  ]);
  const data = shortsWithExtra.slice(0, limitNumber);

  res.status(200).json({
    page: 1,
    limit: limitNumber,
    total,
    totalPages: Math.ceil(total / limitNumber),
    hasNextPage: shortsWithExtra.length > limitNumber,
    nextCursor: buildToqueCursor(data[data.length - 1]),
    previousCursor: buildToqueCursor(data[0]),
    data: data.map(toToqueResponse),
  });
};

const sendToquePage = async (
  req: Request,
  res: Response,
  filters: Record<string, unknown>
): Promise<void> => {
  const pageNumber = parsePositiveInteger(req.query.page, 1);
  const limitNumber = parsePositiveInteger(req.query.limit, 10, 50);
  const cursorFilter = buildCursorFilter(
    req.query.cursorCreatedAt,
    req.query.cursorId,
    req.query.direction
  );

  if (cursorFilter) {
    await sendCursorPage(res, filters, cursorFilter, limitNumber);
    return;
  }

  const skip = (pageNumber - 1) * limitNumber;

  const [shorts, total] = await Promise.all([
    ToqueModel.find(filters)
      .sort(TOQUE_SORT)
      .skip(skip)
      .limit(limitNumber)
      .populate({ path: "creatorId", select: TOQUE_CREATOR_SELECT }),
    ToqueModel.countDocuments(filters),
  ]);
  const totalPages = Math.ceil(total / limitNumber);

  res.status(200).json({
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    nextCursor: buildToqueCursor(shorts[shorts.length - 1]),
    previousCursor: buildToqueCursor(shorts[0]),
    data: shorts.map(toToqueResponse),
  });
};

export const getShorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { area, q } = req.query;
    const areaValue = getQueryString(area).toLowerCase();
    const searchRegex = buildSearchRegex(q);
    const filters: Record<string, unknown> = { isPublished: { $ne: false } };

    if (areaValue && areaValue !== "todos") {
      filters.area = areaValue;
    }

    if (searchRegex) {
      filters.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { area: searchRegex },
        { mediaType: searchRegex },
      ];
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