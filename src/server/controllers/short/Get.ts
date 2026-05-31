import { Request, Response } from "express";
import ToqueModel from "../../models/shorts/app";

/**
 * GET /api/shorts
 * Query params:
 * - area (opcional)
 * - page (opcional)
 * - limit (opcional)
 */
export const getShorts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { area, page, limit } = req.query;

    // 🔹 usamos Record<string, unknown> e type assertion
    const filters: Record<string, unknown> = {};

    if (area && area !== "todos") {
      filters.area = area.toString().toLowerCase();
    }

    const pageNumber = Math.max(Number(page || "1"), 1);
    const limitNumber = Math.min(Number(limit || "10"), 50);
    const skip = (pageNumber - 1) * limitNumber;

    // 🔹 type assertion aqui resolve o TS
    const [shorts, total] = await Promise.all([
      ToqueModel.find(filters as any)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      ToqueModel.countDocuments(filters as any),
    ]);

    const shortsMapped = shorts.map((s) => ({
      _id: s._id,
      area: s.area,
      title: s.title,
      description: s.description,
      mediaType: s.mediaType,
      videoUrl: s.video?.url,
      imageUrl: s.image?.url,
      isPublished: s.isPublished,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.status(200).json({
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
      data: shortsMapped,
    });
  } catch (error) {
    console.error("Erro ao buscar shorts:", error);
    res.status(500).json({
      error: "Failed to fetch shorts",
    });
  }
};
