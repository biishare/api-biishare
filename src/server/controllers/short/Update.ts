import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  canManageCreatorContent,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import ToqueModel from "../../models/shorts/app";
import { toToquePreview } from "./Saved";

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

    if (mediaType !== undefined && mediaType !== "video") {
      res.status(400).json({ error: "Toques aceitam apenas videos." });
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

    const nextVideoUrl =
      typeof videoUrl === "string" ? videoUrl.trim() : toque.video?.url;

    if (!nextVideoUrl) {
      res.status(400).json({ error: "Toque precisa de um link de video." });
      return;
    }

    if (typeof isPublished === "boolean") {
      toque.isPublished = isPublished;
    }

    toque.mediaType = "video";
    toque.video = { url: nextVideoUrl };
    toque.image = undefined;

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
