import { Request, Response } from "express";

import { clearAuthCookie } from "./utils";

export const logout = async (
  _req: Request,
  res: Response
): Promise<void> => {
  clearAuthCookie(res);

  res.status(200).json({
    message: "Sessao terminada com sucesso!",
  });
};
