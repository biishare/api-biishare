// GET /api/posts/filters
import { Request, Response } from "express";
import PostModel from "../../models/post/app";

export const getPostFilters = async (
  req: Request,
  res: Response
) => {
  try {
    const [subjectIds, legacySubjectIds, levels, contentTypes] = await Promise.all([
      PostModel.distinct("subjectIds"),
      PostModel.distinct("subjectId"),
      PostModel.distinct("level"),
      PostModel.distinct("contentType"),
    ]);
    const subjects = [...new Set([...subjectIds, ...legacySubjectIds].filter(Boolean))];

    res.status(200).json({
      subjects,
      levels,
      contentTypes,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch filters",
    });
  }
};
