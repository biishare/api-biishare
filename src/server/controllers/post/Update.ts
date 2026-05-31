import { Request, Response } from "express";
import PostModel from "../../models/post/app";

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    if (!postId) {
      res.status(400).json({ error: "ID do post é obrigatório." });
      return;
    }

    // Só pega os campos permitidos do body
    const { subjectId, title, year, level, imageLink, videos, documents } = req.body;

    const updateData: Partial<typeof req.body> = { subjectId, title, year, level, imageLink };

    if (videos) {
      updateData.videos = videos;
      updateData.documents = undefined; // remove documents se vídeos forem enviados
    }

    if (documents) {
      updateData.documents = documents;
      updateData.videos = undefined; // remove vídeos se documentos forem enviados
    }

    // Atualiza e retorna o documento atualizado
    const updatedPost = await PostModel.findByIdAndUpdate(postId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      res.status(404).json({ error: "Post não encontrado." });
      return;
    }

    res.status(200).json({ message: "Post atualizado com sucesso!", data: updatedPost });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar o post." });
  }
};
