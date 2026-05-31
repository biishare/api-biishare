// controllers/postController.ts
import { Request, Response } from "express";
import PostModel from "../../models/post/app";

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "ID do post é obrigatório." });
      return;
    }

    const deletedPost = await PostModel.findByIdAndDelete(id);

    if (!deletedPost) {
      res.status(404).json({ error: "Post não encontrado." });
      return;
    }

    res.status(200).json({ message: "Post apagado com sucesso!", data: deletedPost });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Erro ao apagar o post." });
  }
};
