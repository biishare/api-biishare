import { Request, Response } from "express";
import { z } from "zod";

import UserModel from "../../models/user/app";
import {
  createAuthToken,
  ensureUserUsername,
  sanitizeUser,
  setAuthCookie,
  verifyPassword,
} from "./utils";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Dados de login invalidos.",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;
    const user = await UserModel.findOne({ email }).select("+passwordHash");

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({
        error: "Email ou palavra-passe invalidos.",
      });
      return;
    }

    const userWithUsername = await ensureUserUsername(user);
    const token = createAuthToken(userWithUsername);

    setAuthCookie(res, token);

    res.status(200).json({
      message: "Sessao iniciada com sucesso!",
      user: sanitizeUser(userWithUsername),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao iniciar sessao." });
  }
};
