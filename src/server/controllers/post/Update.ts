import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  canManageCreatorContent,
  getAuthenticatedContentOwner,
} from "../creatorOwnership";
import { normalizeContentLocale } from "../../i18n/locales";
import PostModel, { PostContentType } from "../../models/post/app";
import { toPostResponse } from "./Presenter";
import { hasTranslatablePostChanges, markPostTranslationsStale } from "./Translation";
import { normalizeSubjectIds } from "./utils";

const CONTENT_TYPES: PostContentType[] = ["video", "document", "image", "playlist"];

const isContentType = (value: unknown): value is PostContentType =>
  typeof value === "string" && CONTENT_TYPES.includes(value as PostContentType);

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    if (typeof postId !== "string" || !Types.ObjectId.isValid(postId)) {
      res.status(400).json({ error: "ID do post e obrigatorio." });
      return;
    }

    const owner = await getAuthenticatedContentOwner(res);

    if (!owner) {
      res.status(401).json({ error: "Sessao obrigatoria." });
      return;
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      res.status(404).json({ error: "Post nao encontrado." });
      return;
    }

    if (!canManageCreatorContent(post.creatorId, owner)) {
      res.status(403).json({ error: "Nao tens permissao para editar este post." });
      return;
    }

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

    if (subjectIds.length > 0) {
      const primarySubjectId = subjectIds[0];

      if (primarySubjectId) {
        post.subjectIds = subjectIds;
        post.subjectId = primarySubjectId;
      }
    }

    if (title !== undefined) {
      post.title = typeof title === "string" ? title.trim() : title;
    }

    if (description !== undefined) {
      post.description =
        typeof description === "string" ? description.trim() : description;
    }

    if (level !== undefined) {
      post.level = typeof level === "string" ? level.trim() : level;
    }

    if (contentType !== undefined) {
      if (!isContentType(contentType)) {
        res.status(400).json({ error: "Tipo de conteudo invalido." });
        return;
      }

      post.contentType = contentType;
    }

    if (imageLink !== undefined) {
      post.imageLink =
        typeof imageLink === "string" ? imageLink.trim() : imageLink;
    }

    if (typeof isPublished === "boolean") {
      post.isPublished = isPublished;
    }

    if (playlistTitle !== undefined) {
      const normalizedPlaylistTitle =
        typeof playlistTitle === "string" ? playlistTitle.trim() : "";

      if (normalizedPlaylistTitle) {
        post.playlistTitle = normalizedPlaylistTitle;
      } else {
        post.set("playlistTitle", undefined);
      }
    }

    if (playlistOrder !== undefined) {
      const normalizedPlaylistOrder = Number(playlistOrder);

      if (Number.isFinite(normalizedPlaylistOrder) && normalizedPlaylistOrder > 0) {
        post.playlistOrder = Math.floor(normalizedPlaylistOrder);
      } else {
        post.set("playlistOrder", undefined);
      }
    }

    if (Array.isArray(videos)) {
      post.videos = videos;
      post.set("documents", undefined);
      post.set("images", undefined);
      post.set("playlist", undefined);
    }

    if (Array.isArray(documents)) {
      post.documents = documents;
      post.set("videos", undefined);
      post.set("images", undefined);
      post.set("playlist", undefined);
    }

    if (Array.isArray(images)) {
      post.images = images;
      post.set("videos", undefined);
      post.set("documents", undefined);
      post.set("playlist", undefined);
    }

    if (Array.isArray(playlist)) {
      post.playlist = playlist;
      post.set("videos", undefined);
      post.set("documents", undefined);
      post.set("images", undefined);
    }

    if (hasTranslatablePostChanges(req.body)) {
      markPostTranslationsStale(post);
    }

    await post.save();

    res.status(200).json({
      message: "Post atualizado com sucesso!",
      data: toPostResponse(post, {
        locale: normalizeContentLocale(req.query.locale),
      }),
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar o post." });
  }
};