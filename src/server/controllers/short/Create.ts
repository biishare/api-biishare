import { Request, Response } from "express";
import ToqueModel from "../../models/shorts/app";

/* ======================================================
 * CREATE TOQUE (SHORT)
 * ====================================================== */
export const create = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      area,
      title,
      description,
      mediaType,
      videoUrl,
      imageUrl,
    } = req.body;

    /* ---------- VALIDAÇÕES BASE ---------- */
    if (!area || !title || !description || !mediaType) {
      res.status(400).json({
        error: "Campos obrigatórios ausentes.",
      });
      return;
    }

    /* ---------- VALIDAÇÕES DE TEXTO ---------- */
    if (title.trim().length < 3 || title.trim().length > 80) {
      res.status(400).json({
        error: "Título deve ter entre 3 e 80 caracteres.",
      });
      return;
    }

    if (description.trim().length < 20 || description.trim().length > 600) {
      res.status(400).json({
        error: "Descrição deve ter entre 20 e 600 caracteres.",
      });
      return;
    }

    /* ---------- VALIDAÇÃO POR TIPO DE MÍDIA ---------- */
    if (mediaType === "video") {
      if (!videoUrl || typeof videoUrl !== "string") {
        res.status(400).json({
          error: "Toque do tipo vídeo precisa de um link de vídeo.",
        });
        return;
      }
    }

    if (mediaType === "image") {
      if (!imageUrl || typeof imageUrl !== "string") {
        res.status(400).json({
          error: "Toque do tipo imagem precisa de um link de imagem.",
        });
        return;
      }
    }

    /* ---------- CREATE ---------- */
    const newToque = new ToqueModel({
      area: area.toLowerCase().trim(),
      title: title.trim(),
      description: description.trim(),
      mediaType,

      ...(mediaType === "video" && { video: { url: videoUrl.trim() } }),
      ...(mediaType === "image" && { image: { url: imageUrl.trim() } }),
    });

    await newToque.save();

    res.status(201).json({
      message: "Toque criado com sucesso!",
      data: newToque,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error: error?.message || "Erro ao criar toque.",
    });
  }
};
