import { Request, Response } from "express";
import PostModel from "../../models/post/app";

export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await PostModel.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};
