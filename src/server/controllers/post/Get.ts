import { Request, Response } from "express";
import PostModel from "../../models/post/app";

/**
 * GET /api/posts
 * Query params:
 * - subjectId
 * - level
 * - year
 * - contentType  ✅ (ADICIONADO)
 * - page (opcional)
 * - limit (opcional)
 */
export const getPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      subjectId,
      level,
      year,
      contentType,
      page = "1",
      limit = "20",
    } = req.query;

    const filters: Record<string, any> = {};

    /* ---------- FILTROS ---------- */

    if (subjectId) {
      filters.subjectId = subjectId;
    }

    if (level) {
      filters.level = level;
    }

    if (year) {
      filters.year = Number(year);
    }

    // 🔥 FIX CRÍTICO: filtro por enum
    if (contentType === "video" || contentType === "document") {
      filters.contentType = contentType;
    }

    /* ---------- PAGINAÇÃO ---------- */

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Number(limit), 50);
    const skip = (pageNumber - 1) * limitNumber;

    /* ---------- QUERY ---------- */

    const [posts, total] = await Promise.all([
      PostModel.find(filters)
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
      data: posts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch posts",
    });
  }
};
