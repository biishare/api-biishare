import { Request, Response } from "express";
import { Types } from "mongoose";

import { uploadPublicationMediaToCloudinary } from "../../services/cloudinary";

export const uploadPublicationMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;
    const userId = res.locals.userId;

    if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    if (!file) {
      res.status(400).json({ error: "Seleciona um ficheiro." });
      return;
    }

    const data = await uploadPublicationMediaToCloudinary({ file, userId });

    res.status(201).json({ data });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error?.message || "Nao foi possivel carregar o ficheiro." });
  }
};
