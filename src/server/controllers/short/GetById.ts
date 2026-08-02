import { Request, Response } from "express";
import { Types } from "mongoose";

import ToqueModel from "../../models/shorts/app";
import { toToquePreview } from "./Saved";

export const getToqueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid toque id" });
    }

    const toque = await ToqueModel.findById(id);

    if (!toque) {
      return res.status(404).json({ error: "Toque not found" });
    }

    res.json(toToquePreview(toque));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch toque" });
  }
};
