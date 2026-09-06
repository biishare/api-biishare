import { Request, Response } from "express";

import { normalizeContentLocale } from "../../i18n/locales";
import UserModel from "../../models/user/app";
import { ensureUserUsername, sanitizeUser } from "./utils";

export const updatePreferredLocale = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const preferredLocale = normalizeContentLocale(req.body?.preferredLocale);

    if (!preferredLocale) {
      res.status(400).json({ error: "Idioma invalido." });
      return;
    }

    const user = await UserModel.findByIdAndUpdate(
      res.locals.userId,
      { $set: { preferredLocale } },
      { new: true }
    );

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
    res.status(500).json({ error: "Erro ao atualizar idioma." });
  }
};