import { Request, Response } from "express";
import { z } from "zod";

import UserModel from "../../models/user/app";
import {
  createAuthToken,
  hashPassword,
  sanitizeUser,
  setAuthCookie,
} from "./utils";
import { isValidUsername, normalizeUsername } from "./username";

const registerSchema = z
  .object({
    name: z.string().trim().min(3).max(100),
    username: z.string().trim().min(3).max(30),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Dados de registo invalidos.",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password } = validation.data;
    const username = normalizeUsername(validation.data.username);

    if (!isValidUsername(username)) {
      res.status(400).json({
        error:
          "Username deve ter 3 a 30 caracteres e usar apenas letras, numeros e hifens.",
      });
      return;
    }

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser?.email === email) {
      res.status(409).json({
        error: "Ja existe uma conta com este email.",
      });
      return;
    }

    if (existingUser?.username === username) {
      res.status(409).json({
        error: "Este username ja esta em uso.",
      });
      return;
    }

    const user = await UserModel.create({
      name,
      username,
      email,
      passwordHash: await hashPassword(password),
    });

    setAuthCookie(res, createAuthToken(user));

    res.status(201).json({
      message: "Conta criada com sucesso!",
      user: sanitizeUser(user),
    });
  } catch (error: unknown) {
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const duplicatedField = Object.keys(mongoError.keyPattern || {})[0];

      res.status(409).json({
        error:
          duplicatedField === "username"
            ? "Este username ja esta em uso."
            : "Ja existe uma conta com este email.",
      });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "Erro ao criar a conta." });
  }
};
