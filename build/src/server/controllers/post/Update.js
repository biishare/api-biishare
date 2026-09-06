"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const mongoose_1 = require("mongoose");
const creatorOwnership_1 = require("../creatorOwnership");
const locales_1 = require("../../i18n/locales");
const app_1 = __importDefault(require("../../models/post/app"));
const Presenter_1 = require("./Presenter");
const Translation_1 = require("./Translation");
const utils_1 = require("./utils");
const CONTENT_TYPES = ["video", "document", "image", "playlist"];
const isContentType = (value) => typeof value === "string" && CONTENT_TYPES.includes(value);
const update = async (req, res) => {
    try {
        const { postId } = req.params;
        if (typeof postId !== "string" || !mongoose_1.Types.ObjectId.isValid(postId)) {
            res.status(400).json({ error: "ID do post e obrigatorio." });
            return;
        }
        const owner = await (0, creatorOwnership_1.getAuthenticatedContentOwner)(res);
        if (!owner) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const post = await app_1.default.findById(postId);
        if (!post) {
            res.status(404).json({ error: "Post nao encontrado." });
            return;
        }
        if (!(0, creatorOwnership_1.canManageCreatorContent)(post.creatorId, owner)) {
            res.status(403).json({ error: "Nao tens permissao para editar este post." });
            return;
        }
        const { subjectId, subjectIds: rawSubjectIds, title, description, level, contentType, imageLink, videos, documents, images, playlist, isPublished, playlistTitle, playlistOrder, } = req.body;
        const subjectIds = (0, utils_1.normalizeSubjectIds)(rawSubjectIds, subjectId);
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
            const normalizedPlaylistTitle = typeof playlistTitle === "string" ? playlistTitle.trim() : "";
            if (normalizedPlaylistTitle) {
                post.playlistTitle = normalizedPlaylistTitle;
            }
            else {
                post.set("playlistTitle", undefined);
            }
        }
        if (playlistOrder !== undefined) {
            const normalizedPlaylistOrder = Number(playlistOrder);
            if (Number.isFinite(normalizedPlaylistOrder) && normalizedPlaylistOrder > 0) {
                post.playlistOrder = Math.floor(normalizedPlaylistOrder);
            }
            else {
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
        if ((0, Translation_1.hasTranslatablePostChanges)(req.body)) {
            (0, Translation_1.markPostTranslationsStale)(post);
        }
        await post.save();
        res.status(200).json({
            message: "Post atualizado com sucesso!",
            data: (0, Presenter_1.toPostResponse)(post, {
                locale: (0, locales_1.normalizeContentLocale)(req.query.locale),
            }),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar o post." });
    }
};
exports.update = update;
