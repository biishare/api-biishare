import { Request, Response } from "express";

import UserModel from "../../models/user/app";
import { ensureUserUsername, sanitizeUser } from "./utils";

export const getMe = async (_req: Request, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(res.locals.userId);

    if (!user) {
      res.status(404).json({ error: "Utilizador nao encontrado." });
      return;
    }

    const userWithUsername = await ensureUserUsername(user);

    res.status(200).json({
      user: sanitizeUser(userWithUsername),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar perfil." });
  }
};
