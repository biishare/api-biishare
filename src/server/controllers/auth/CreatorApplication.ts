import { Request, Response } from "express";

import { isAutoApproveCreatorEmail } from "../../config/creator";
import UserModel from "../../models/user/app";
import { ensureUserUsername, sanitizeUser } from "./utils";

type CreatorApplicationRequest = Request & {
  file?: Express.Multer.File | undefined;
};

const getTrimmedString = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const applyCreatorApplication = async (
  req: CreatorApplicationRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await UserModel.findById(res.locals.userId);

    if (!user) {
      res.status(404).json({ error: "Utilizador nao encontrado." });
      return;
    }

    const userWithUsername = await ensureUserUsername(user);
    const now = new Date();

    if (userWithUsername.creatorStatus === "approved") {
      res.status(200).json({
        message: "Conta de criador ja ativa.",
        creatorStatus: "approved",
        user: sanitizeUser(userWithUsername),
      });
      return;
    }

    if (isAutoApproveCreatorEmail(userWithUsername.email)) {
      userWithUsername.creatorStatus = "approved";
      userWithUsername.creatorAppliedAt = userWithUsername.creatorAppliedAt || now;
      userWithUsername.creatorApprovedAt = now;
      userWithUsername.set("creatorApplication", undefined);
      await userWithUsername.save();

      res.status(200).json({
        message: "Conta de criador ativada.",
        creatorStatus: "approved",
        user: sanitizeUser(userWithUsername),
      });
      return;
    }

    const publicName = getTrimmedString(req.body.publicName, 100);
    const workDescription = getTrimmedString(req.body.workDescription, 500);
    const verificationCode = getTrimmedString(req.body.verificationCode, 40);
    const verificationPhotoName = getTrimmedString(
      req.file?.originalname || req.body.verificationPhotoName,
      220
    );
    const consentAccepted =
      req.body.consentAccepted === true || req.body.consentAccepted === "true";

    if (
      publicName.length < 3 ||
      workDescription.length < 3 ||
      !verificationCode ||
      !verificationPhotoName ||
      !consentAccepted
    ) {
      res.status(400).json({
        error: "Preencha os dados e envie a verificacao para continuar.",
      });
      return;
    }

    userWithUsername.creatorStatus = "pending";
    userWithUsername.creatorAppliedAt = now;
    userWithUsername.set("creatorApprovedAt", undefined);
    userWithUsername.creatorApplication = {
      workDescription,
      publicName,
      verificationCode,
      verificationPhotoName,
      submittedAt: now,
    };

    await userWithUsername.save();

    res.status(202).json({
      message: "Pedido de criador enviado para revisao.",
      creatorStatus: "pending",
      user: sanitizeUser(userWithUsername),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao processar pedido de criador." });
  }
};
