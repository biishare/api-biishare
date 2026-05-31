import { Request, Response } from "express";
import mongoose from "mongoose";
import AdModel from "../../models/ad/app";

/* ======================================================
 * GET AD BY ID
 * ====================================================== */

export const getAdById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rawId = req.params.id;

    const id = Array.isArray(rawId)
      ? rawId[0]
      : rawId;

    /* ---------- VALIDATE ID ---------- */

    if (!id) {
      res.status(400).json({
        error:
          "ID do anúncio é obrigatório.",
      });

      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      res.status(400).json({
        error: "ID inválido.",
      });

      return;
    }

    /* ---------- QUERY ---------- */

    const ad =
      await AdModel.findById(id);

    if (!ad) {
      res.status(404).json({
        error:
          "Anúncio não encontrado.",
      });

      return;
    }

    /* ---------- NORMALIZED RESPONSE ---------- */

    const data = {
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
    };

    /* ---------- RESPONSE ---------- */

    res.status(200).json({
      message:
        "Anúncio encontrado com sucesso",

      data,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error:
        error?.message ||
        "Failed to fetch ad",
    });
  }
};