import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  canManageCreatorContent,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import ToqueModel from "../../models/shorts/app";
import { toToquePreview } from "./Saved";

export const deleteToque = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      res.status(403).json({ error: "Nao tens permissao para apagar este toque." });
      return;
    }

    const data = toToquePreview(toque);
    await toque.deleteOne();

    res.status(200).json({
      message: "Toque apagado com sucesso!",
      data,
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Erro ao apagar o toque." });
  }
};