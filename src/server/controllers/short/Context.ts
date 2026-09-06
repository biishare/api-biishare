import { Request, Response } from "express";
import { Types } from "mongoose";

import ToqueModel, { ToqueDocument } from "../../models/shorts/app";
import { TOQUE_CREATOR_SELECT, TOQUE_SORT, toToqueResponse } from "./Get";

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

const buildCursor = (toque?: ToqueDocument) => {
  if (!toque) return undefined;

  return {
    id: toque._id.toString(),
    createdAt: toque.createdAt,
  };
};

const buildPublishedFilter = (area?: string): Record<string, unknown> => {
  const filters: Record<string, unknown> = {
    isPublished: { $ne: false },
  };

  if (area && area !== "todos") {
    filters.area = area;
  }

  return filters;
};

const buildBeforeFilter = (toque: ToqueDocument) => ({
  $or: [
    { createdAt: { $gt: toque.createdAt } },
    { createdAt: toque.createdAt, _id: { $gt: toque._id } },
  ],
});

const buildAfterFilter = (toque: ToqueDocument) => ({
  $or: [
    { createdAt: { $lt: toque.createdAt } },
    { createdAt: toque.createdAt, _id: { $lt: toque._id } },
  ],
});

export const getToqueContext = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid toque id" });
      return;
    }

    const current = await ToqueModel.findOne({
      _id: new Types.ObjectId(id),
      isPublished: { $ne: false },
    }).populate({ path: "creatorId", select: TOQUE_CREATOR_SELECT });

    if (!current) {
      res.status(404).json({ error: "Toque not found" });
      return;
    }

    const requestedArea = getQueryString(req.query.area).toLowerCase();
    const effectiveArea =
      requestedArea && requestedArea !== "todos" && requestedArea !== current.area
        ? current.area
        : requestedArea;
    const baseFilter = buildPublishedFilter(effectiveArea);
    const beforeLimit = parsePositiveInteger(req.query.before, 6, 20);
    const afterLimit = parsePositiveInteger(req.query.after, 10, 30);

    const [beforeWithExtra, afterWithExtra] = await Promise.all([
      ToqueModel.find({ $and: [baseFilter, buildBeforeFilter(current)] })
        .sort(TOQUE_SORT)
        .limit(beforeLimit + 1)
        .populate({ path: "creatorId", select: TOQUE_CREATOR_SELECT }),
      ToqueModel.find({ $and: [baseFilter, buildAfterFilter(current)] })
        .sort(TOQUE_SORT)
        .limit(afterLimit + 1)
        .populate({ path: "creatorId", select: TOQUE_CREATOR_SELECT }),
    ]);
    const before = beforeWithExtra.slice(0, beforeLimit);
    const after = afterWithExtra.slice(0, afterLimit);
    const data = [...before, current, ...after];

    res.status(200).json({
      data: data.map(toToqueResponse),
      current: toToqueResponse(current),
      currentIndex: before.length,
      hasBefore: beforeWithExtra.length > beforeLimit,
      hasAfter: afterWithExtra.length > afterLimit,
      beforeCursor: buildCursor(before[0]),
      afterCursor: buildCursor(after[after.length - 1]),
      requestedArea: requestedArea || "todos",
      effectiveArea: effectiveArea || "todos",
      areaAdjusted: Boolean(
        requestedArea &&
        requestedArea !== "todos" &&
        requestedArea !== current.area
      ),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch toque context" });
  }
};