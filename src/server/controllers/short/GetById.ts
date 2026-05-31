import { Request, Response } from "express";
import ToqueModel from "../../models/shorts/app";

export const getToqueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const toque = await ToqueModel .findById(id);

    if (!toque) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(toque);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch toque" });
  }
};
