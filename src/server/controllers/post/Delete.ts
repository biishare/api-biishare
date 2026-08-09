import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  canManageCreatorContent,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import PostModel from "../../models/post/app";

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "ID do post e obrigatorio." });
      return;
    }

    const owner = await getAuthenticatedContentOwner(res);

    if (!owner) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const post = await PostModel.findById(id);

    if (!post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    if (!canManageCreatorContent(post.creatorId, owner)) {
      res.status(403).json({ error: "Nao tens permissao para apagar este post." });
      return;
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post apagado com sucesso!", data: post });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Erro ao apagar o post." });
  }
};