import { Request, Response } from "express";

import UserModel from "../../models/user/app";
import { uploadProfileImageToCloudinary } from "../../services/cloudinary";
import { sanitizeUser } from "./utils";

type ProfileImageFiles = {
  avatar?: Express.Multer.File[];
  cover?: Express.Multer.File[];
};

export const uploadProfileImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as ProfileImageFiles | undefined;
    const avatar = files?.avatar?.[0];
    const cover = files?.cover?.[0];

    if (!avatar && !cover) {
      res.status(400).json({
        error: "Envie pelo menos uma imagem.",
      });
      return;
    }

    const user = await UserModel.findById(res.locals.userId);

    if (!user) {
      res.status(404).json({ error: "Utilizador nao encontrado." });
      return;
    }

    if (avatar) {
      user.avatarUrl = await uploadProfileImageToCloudinary({
        file: avatar,
        slot: "avatar",
        userId: user._id.toString(),
      });
    }

    if (cover) {
      user.coverUrl = await uploadProfileImageToCloudinary({
        file: cover,
        slot: "cover",
        userId: user._id.toString(),
      });
    }

    await user.save();

    res.status(200).json({
      message: "Imagens do perfil atualizadas com sucesso!",
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      error: error?.message || "Erro ao atualizar imagens do perfil.",
    });
  }
};
