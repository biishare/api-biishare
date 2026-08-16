import { Request, Response } from "express";
import { Types } from "mongoose";
import ToqueModel from "../../models/shorts/app";
import { toToquePreview } from "./Saved";

type ImagePayloadItem = {
  url?: unknown;
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getImageUrlsFromBody = (body: Record<string, unknown>): string[] => {
  const images = Array.isArray(body.images) ? body.images : [];
  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
  const urls = [
    ...images.map((item) =>
      typeof item === "string"
        ? asOptionalString(item)
        : asOptionalString((item as ImagePayloadItem)?.url)
    ),
    ...imageUrls.map(asOptionalString),
    asOptionalString(body.imageUrl),
  ];

  return Array.from(new Set(urls.filter((url): url is string => Boolean(url))));
};

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
      isPublished,
    } = req.body;
    const userId = res.locals.userId;

    if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const creatorId = new Types.ObjectId(userId);

    if (!area || !title || !description || !mediaType) {
      res.status(400).json({ error: "Campos obrigatorios ausentes." });
      return;
    }

    if (mediaType !== "video" && mediaType !== "image") {
      res.status(400).json({ error: "Toques aceitam video ou imagem." });
      return;
    }

    if (title.trim().length < 3 || title.trim().length > 80) {
      res.status(400).json({ error: "Titulo deve ter entre 3 e 80 caracteres." });
      return;
    }

    if (description.trim().length < 20 || description.trim().length > 600) {
      res.status(400).json({ error: "Descricao deve ter entre 20 e 600 caracteres." });
      return;
    }

    if (mediaType === "video" && (!videoUrl || typeof videoUrl !== "string")) {
      res.status(400).json({ error: "Toque precisa de um link de video." });
      return;
    }

    const imageUrls = mediaType === "image" ? getImageUrlsFromBody(req.body) : [];

    if (mediaType === "image" && imageUrls.length === 0) {
      res.status(400).json({ error: "Toque precisa de pelo menos uma imagem." });
      return;
    }

    const newToque = new ToqueModel({
      creatorId,
      area: area.toLowerCase().trim(),
      title: title.trim(),
      description: description.trim(),
      mediaType,
      video: mediaType === "video" ? { url: videoUrl.trim() } : undefined,
      image: mediaType === "image" ? { url: imageUrls[0] } : undefined,
      images: mediaType === "image" ? imageUrls.map((url) => ({ url })) : undefined,
      isPublished: isPublished !== false,
    });

    await newToque.save();

    res.status(201).json({
      message: "Toque criado com sucesso!",
      data: toToquePreview(newToque),
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error: error?.message || "Erro ao criar toque.",
    });
  }
};