import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  canManageCreatorContent,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import ToqueModel from "../../models/shorts/app";
import { toToquePreview } from "./Saved";

type ImagePayloadItem = {
  url?: unknown;
};

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const hasImagePayload = (body: Record<string, unknown>): boolean =>
  body.imageUrl !== undefined || body.imageUrls !== undefined || body.images !== undefined;

const getImageUrlsFromBody = (body: Record<string, unknown>, fallback: string[]): string[] => {
  if (!hasImagePayload(body)) {
    return fallback;
  }

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

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "ID do toque e obrigatorio." });
      return;
    }

    const owner = await getAuthenticatedContentOwner(res);

    if (!owner) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const toque = await ToqueModel.findById(id);

    if (!toque) {
      res.status(404).json({ error: "Toque nao encontrado." });
      return;
    }

    if (!canManageCreatorContent(toque.creatorId, owner)) {
      res.status(403).json({ error: "Nao tens permissao para editar este toque." });
      return;
    }

    const { area, title, description, mediaType, videoUrl, isPublished } = req.body;
    const nextMediaType = mediaType ?? toque.mediaType;

    if (nextMediaType !== "video" && nextMediaType !== "image") {
      res.status(400).json({ error: "Toques aceitam video ou imagem." });
      return;
    }

    if (area !== undefined) {
      toque.area = typeof area === "string" ? area.toLowerCase().trim() : area;
    }

    if (title !== undefined) {
      toque.title = typeof title === "string" ? title.trim() : title;
    }

    if (description !== undefined) {
      toque.description =
        typeof description === "string" ? description.trim() : description;
    }

    const fallbackImageUrls = [
      ...(toque.images ?? []).map((item) => item.url),
      toque.image?.url,
    ].filter((url): url is string => Boolean(url));
    const nextVideoUrl =
      typeof videoUrl === "string" ? videoUrl.trim() : toque.video?.url;
    const nextImageUrls = getImageUrlsFromBody(req.body, fallbackImageUrls);

    if (nextMediaType === "video" && !nextVideoUrl) {
      res.status(400).json({ error: "Toque precisa de um link de video." });
      return;
    }

    if (nextMediaType === "image" && nextImageUrls.length === 0) {
      res.status(400).json({ error: "Toque precisa de pelo menos uma imagem." });
      return;
    }

    if (typeof isPublished === "boolean") {
      toque.isPublished = isPublished;
    }

    toque.mediaType = nextMediaType;
    toque.video = nextMediaType === "video" ? { url: nextVideoUrl as string } : undefined;
    toque.image = nextMediaType === "image" ? { url: nextImageUrls[0] as string } : undefined;
    toque.images = nextMediaType === "image" ? nextImageUrls.map((url) => ({ url })) : undefined;

    await toque.save();

    res.status(200).json({
      message: "Toque atualizado com sucesso!",
      data: toToquePreview(toque),
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar o toque." });
  }
};