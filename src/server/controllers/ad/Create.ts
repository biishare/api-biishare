import { Request, Response } from "express";
import AdModel from "../../models/ad/app";

/* ======================================================
 * CREATE AD
 * ====================================================== */

export const create = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      subtitle,
      cta,
      link,

      mediaType,
      image,
      video,

      layout,
      fitMode,
      focalPoint,
      blurStrength,
      priority,
      active,
    } = req.body;

    /* ---------- BASE VALIDATION ---------- */

    if (!mediaType || !layout) {
      res.status(400).json({
        error:
          "Tipo de mídia e layout são obrigatórios.",
      });

      return;
    }

    /* ---------- IMAGE VALIDATION ---------- */

    if (mediaType === "image") {
      if (!image) {
        res.status(400).json({
          error: "Imagem obrigatória.",
        });

        return;
      }

      if (!isValidUrl(image)) {
        res.status(400).json({
          error: "URL da imagem inválida.",
        });

        return;
      }
    }

    /* ---------- VIDEO VALIDATION ---------- */

    if (mediaType === "video") {
      if (!video) {
        res.status(400).json({
          error: "Vídeo obrigatório.",
        });

        return;
      }

      if (!isValidUrl(video)) {
        res.status(400).json({
          error: "URL do vídeo inválida.",
        });

        return;
      }
    }

    /* ---------- NORMALIZAÇÃO ---------- */

    const cleanTitle = title?.trim();

    const cleanSubtitle = subtitle?.trim();

    const cleanCta = cta?.trim();

    const cleanLink = link?.trim();

    /* ---------- PAYLOAD ---------- */

    const payload: any = {
      title: cleanTitle,
      subtitle: cleanSubtitle,
      cta: cleanCta,
      link: cleanLink,

      mediaType,

      layout,
      fitMode,
      focalPoint,

      blurStrength:
        blurStrength ?? 16,

      priority:
        priority ?? "visual",

      active:
        active ?? true,
    };

    /* ---------- MEDIA ---------- */

    if (mediaType === "image") {
      payload.image = {
        url: image.trim(),
      };
    }

    if (mediaType === "video") {
      payload.video = {
        url: video.trim(),
      };
    }

    /* ---------- CREATE ---------- */

    const newAd =
      await AdModel.create(payload);

    res.status(201).json({
      message:
        "Anúncio criado com sucesso!",

      data: newAd,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error:
        error?.message ||
        "Erro ao criar anúncio.",
    });
  }
};

/* ======================================================
 * HELPER
 * ====================================================== */

function isValidUrl(
  url: string
): boolean {
  try {
    new URL(url);

    return true;
  } catch {
    return false;
  }
}