import { Request, Response } from "express";
import AdModel from "../../models/ad/app";

/* ======================================================
 * GET ADS
 * ====================================================== */

export const getAds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      layout,
      active,
      page,
      limit,
    } = req.query;

    /* ---------- NORMALIZE QUERY ---------- */

    const cleanLayout =
      typeof layout === "string"
        ? layout
        : undefined;

    const pageNumber = Math.max(
      Number(page ?? 1),
      1
    );

    const limitNumber = Math.min(
      Number(limit ?? 10),
      50
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const isActive =
      active === undefined
        ? true
        : active === "true";

    /* ---------- FILTERS ---------- */

    const filters: any = {
      active: isActive,
    };

    if (
      cleanLayout &&
      cleanLayout !== "all"
    ) {
      filters.layout = cleanLayout;
    }

    /* ---------- QUERY ---------- */

    const [ads, total] =
      await Promise.all([
        AdModel.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),

        AdModel.countDocuments(
          filters
        ),
      ]);

    /* ---------- RESPONSE ---------- */

    const data = ads.map((ad) => ({
      _id: ad._id,

      title: ad.title,
      subtitle: ad.subtitle,
      cta: ad.cta,

      link: ad.link,

      /* ---------- MEDIA ---------- */

      mediaType: ad.mediaType,

      image: ad.image?.url,

      video: ad.video?.url,

      /* ---------- VISUAL ---------- */

      layout: ad.layout,

      fitMode: ad.fitMode,

      focalPoint:
        ad.focalPoint,

      blurStrength:
        ad.blurStrength,

      priority: ad.priority,

      active: ad.active,

      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    }));

    res.status(200).json({
      page: pageNumber,

      limit: limitNumber,

      total,

      totalPages: Math.ceil(
        total / limitNumber
      ),

      data,
    });
  } catch (error: any) {
    console.error(
      "Erro ao buscar ads:",
      error
    );

    res.status(500).json({
      error:
        error?.message ||
        "Failed to fetch ads",
    });
  }
};