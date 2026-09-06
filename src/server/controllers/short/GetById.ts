import { Request, Response } from "express";
import { Types } from "mongoose";

import ToqueModel from "../../models/shorts/app";
import { TOQUE_CREATOR_SELECT, toToqueResponse } from "./Get";

export const getToqueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid toque id" });
    }

    const toque = await ToqueModel.findById(id).populate({
      path: "creatorId",
      select: TOQUE_CREATOR_SELECT,
    });

    if (!toque) {
      return res.status(404).json({ error: "Toque not found" });
    }

    res.json(toToqueResponse(toque));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch toque" });
  }
};
