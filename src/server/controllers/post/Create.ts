import { Request, Response } from "express";
import { Types } from "mongoose";
import PostModel, { PostContentType } from "../../models/post/app";
import { normalizeSubjectIds } from "./utils";

const CONTENT_TYPES: PostContentType[] = ["video", "document", "image", "playlist"];

const isContentType = (value: unknown): value is PostContentType =>
  typeof value === "string" && CONTENT_TYPES.includes(value as PostContentType);

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subjectId,
      subjectIds: rawSubjectIds,
      title,
      description,
      level,
      contentType,
      imageLink,
      videos,
      documents,
      images,
      playlist,
      isPublished,
      playlistTitle,
      playlistOrder,
    } = req.body;
    const subjectIds = normalizeSubjectIds(rawSubjectIds, subjectId);
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";
    const normalizedLevel = typeof level === "string" ? level.trim() : "";
    const normalizedImageLink =
      typeof imageLink === "string" ? imageLink.trim() : "";
    const normalizedPlaylistTitle =
      typeof playlistTitle === "string" ? playlistTitle.trim() : "";
    const normalizedPlaylistOrder = Number(playlistOrder);
    const userId = res.locals.userId;

    if (typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const creatorId = new Types.ObjectId(userId);

    if (
      subjectIds.length === 0 ||
      !normalizedTitle ||
      !normalizedDescription ||
      !normalizedLevel ||
      !isContentType(contentType) ||
      !normalizedImageLink
    ) {
      res.status(400).json({
        error: "Campos obrigatorios ausentes.",
      });
      return;
    }

    if (contentType === "video" && (!Array.isArray(videos) || videos.length === 0)) {
      res.status(400).json({ error: "Adicione um video." });
      return;
    }

    if (contentType === "document") {
      if (!Array.isArray(documents) || documents.length === 0) {
        res.status(400).json({ error: "Adicione um documento." });
        return;
      }

      const invalidDoc = documents.find(
        (doc: any) => typeof doc.totalPages !== "number" || doc.totalPages < 1
      );

      if (invalidDoc) {
        res.status(400).json({ error: "Todo documento deve conter o numero total de paginas." });
        return;
      }
    }

    if (contentType === "image" && (!Array.isArray(images) || images.length === 0)) {
      res.status(400).json({ error: "Adicione pelo menos uma imagem." });
      return;
    }

    if (contentType === "playlist") {
      if (!Array.isArray(playlist) || playlist.length === 0) {
        res.status(400).json({ error: "Adicione pelo menos um item a playlist." });
        return;
      }

      const invalidItem = playlist.find(
        (item: any) => item.kind !== "video" && item.kind !== "document"
      );

      if (invalidItem) {
        res.status(400).json({ error: "Playlist aceita apenas videos e documentos." });
        return;
      }

      const invalidDoc = playlist.find(
        (item: any) => item.kind === "document" && (typeof item.totalPages !== "number" || item.totalPages < 1)
      );

      if (invalidDoc) {
        res.status(400).json({ error: "Documentos da playlist precisam do numero total de paginas." });
        return;
      }
    }

    const newPost = new PostModel({
      creatorId,
      subjectIds,
      subjectId: subjectIds[0],
      title: normalizedTitle,
      description: normalizedDescription,
      level: normalizedLevel,
      contentType,
      imageLink: normalizedImageLink,
      isPublished: isPublished !== false,
      playlistTitle: normalizedPlaylistTitle || undefined,
      playlistOrder: Number.isFinite(normalizedPlaylistOrder) && normalizedPlaylistOrder > 0
        ? Math.floor(normalizedPlaylistOrder)
        : undefined,
      ...(contentType === "video" && { videos, documents: undefined, images: undefined, playlist: undefined }),
      ...(contentType === "document" && { documents, videos: undefined, images: undefined, playlist: undefined }),
      ...(contentType === "image" && { images, videos: undefined, documents: undefined, playlist: undefined }),
      ...(contentType === "playlist" && { playlist, videos: undefined, documents: undefined, images: undefined }),
    });

    await newPost.save();

    res.status(201).json({
      message: "Post criado com sucesso!",
      data: newPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar o post." });
  }
};
