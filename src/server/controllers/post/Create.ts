import { Request, Response } from "express";
import PostModel from "../../models/post/app";
import { normalizeSubjectIds } from "./utils";

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subjectId,
      subjectIds: rawSubjectIds,
      title,
      description,
      level,
      contentType,
      imageLink,
      videos,
      documents,
    } = req.body;
    const subjectIds = normalizeSubjectIds(rawSubjectIds, subjectId);
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";
    const normalizedLevel = typeof level === "string" ? level.trim() : "";
    const normalizedImageLink =
      typeof imageLink === "string" ? imageLink.trim() : "";

    /* ---------- VALIDAÇÕES BASE ---------- */

    if (
      subjectIds.length === 0 ||
      !normalizedTitle ||
      !normalizedDescription ||
      !normalizedLevel ||
      !contentType ||
      !normalizedImageLink
    ) {
      res.status(400).json({
        error: "Campos obrigatórios ausentes.",
      });
      return;
    }

    /* ---------- VALIDAÇÃO POR TIPO ---------- */

    if (contentType === "video") {
      if (!Array.isArray(videos) || videos.length === 0) {
        res.status(400).json({
          error: "Adicione pelo menos um vídeo.",
        });
        return;
      }
    }

    if (contentType === "document") {
      if (!Array.isArray(documents) || documents.length === 0) {
        res.status(400).json({
          error: "Adicione pelo menos um documento.",
        });
        return;
      }

      const invalidDoc = documents.find(
        (doc: any) =>
          typeof doc.totalPages !== "number" || doc.totalPages < 1
      );

      if (invalidDoc) {
        res.status(400).json({
          error: "Todo documento deve conter o número total de páginas.",
        });
        return;
      }
    }


    /* ---------- CREATE ---------- */

    const newPost = new PostModel({
      subjectIds,
      subjectId: subjectIds[0],
      title: normalizedTitle,
      description: normalizedDescription,
      level: normalizedLevel,
      contentType,
      imageLink: normalizedImageLink,

      ...(contentType === "video" && {
        videos,
        documents: undefined,
      }),

      ...(contentType === "document" && {
        documents,
        videos: undefined,
      }),
    });

    await newPost.save();

    res.status(201).json({
      message: "Post criado com sucesso!",
      data: newPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar o post." });
  }
};
