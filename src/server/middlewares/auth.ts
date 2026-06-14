import { NextFunction, Request, Response } from "express";

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
