import { NextFunction, Request, Response } from "express";

import { isLegacyCreatorEmail } from "../config/legacyCreator";
import UserModel from "../models/user/app";
import {
  getAuthTokenFromCookieHeader,
  verifyAuthToken,
} from "../controllers/auth/utils";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token =
    bearerToken || getAuthTokenFromCookieHeader(req.headers.cookie);

  if (!token) {
    res.status(401).json({ error: "Sessao obrigatoria." });
    return;
  }

  const session = verifyAuthToken(token);

  if (!session) {
    res.status(401).json({ error: "Sessao invalida ou expirada." });
    return;
  }

  res.locals.userId = session.userId;
  next();
};

export const requireCreator = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserModel.findById(res.locals.userId).select("creatorStatus email");

    if (!user || (user.creatorStatus !== "approved" && !isLegacyCreatorEmail(user.email))) {
      res.status(403).json({
        error: "Conta de criador obrigatoria para publicar.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao validar permissao de criador." });
  }
};
