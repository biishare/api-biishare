import { Response } from "express";
import { Types } from "mongoose";

import { isLegacyCreatorEmail } from "../config/legacyCreator";
import UserModel from "../models/user/app";

export type ContentOwner = {
  _id: Types.ObjectId;
  email?: string;
};

export const getAuthenticatedContentOwner = async (
  res: Response
): Promise<ContentOwner | null> => {
  const userId = res.locals.userId;

  if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
    return null;
  }

  const user = await UserModel.findById(userId).select("email");

  if (!user) {
    return null;
  }

  return {
    _id: new Types.ObjectId(userId),
    email: user.email,
  };
};

export const canManageCreatorContent = (
  creatorId: unknown,
  owner: ContentOwner
): boolean => {
  if (creatorId) {
    return creatorId.toString() === owner._id.toString();
  }

  return isLegacyCreatorEmail(owner.email);
};

export const buildCreatorContentFilter = (
  owner: ContentOwner
): Record<string, unknown> => {
  if (isLegacyCreatorEmail(owner.email)) {
    return {
      $or: [
        { creatorId: owner._id },
        { creatorId: { $exists: false } },
        { creatorId: null },
      ],
    };
  }

  return { creatorId: owner._id };
};