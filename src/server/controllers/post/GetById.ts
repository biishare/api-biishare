import { Request, Response } from "express";

import { normalizeContentLocale } from "../../i18n/locales";
import PostModel from "../../models/post/app";
import { toPostResponse } from "./Presenter";

const CREATOR_SELECT = "name username avatarUrl email";

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const locale = normalizeContentLocale(req.query.locale);

    const post = await PostModel.findById(id).populate({
      path: "creatorId",
      select: CREATOR_SELECT,
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(toPostResponse(post, { locale }));
  } catch {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};