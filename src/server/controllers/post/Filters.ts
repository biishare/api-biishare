// GET /api/posts/filters
import { Request, Response } from "express";
import PostModel from "../../models/post/app";

export const getPostFilters = async (
  req: Request,
  res: Response
) => {
  try {
    const [subjects, levels, years, contentTypes] = await Promise.all([
      PostModel.distinct("subjectId"),
      PostModel.distinct("level"),
      PostModel.distinct("year"),
      PostModel.distinct("contentType"),
    ]);

    res.status(200).json({
      subjects,
      levels,
      years: years.sort((a, b) => a - b),
      contentTypes,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch filters",
    });
  }
};
