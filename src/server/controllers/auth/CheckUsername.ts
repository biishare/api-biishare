import { Request, Response } from "express";
import { z } from "zod";

import UserModel from "../../models/user/app";
import { isValidUsername, normalizeUsername } from "./username";

const usernameAvailabilitySchema = z.object({
  username: z.string().trim().min(1),
});

export const checkUsername = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = usernameAvailabilitySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        available: false,
        error: "Username invalido.",
      });
      return;
    }

    const username = normalizeUsername(validation.data.username);

    if (!isValidUsername(username)) {
      res.status(400).json({
        available: false,
        username,
        error:
          "Username deve ter 3 a 30 caracteres e usar apenas letras, numeros e hifens.",
      });
      return;
    }

    const existingUser = await UserModel.exists({ username });

    res.status(200).json({
      username,
      available: !existingUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      available: false,
      error: "Erro ao verificar username.",
    });
  }
};
