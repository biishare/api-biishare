"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const utils_1 = require("./utils");
const update = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            res.status(400).json({ error: "ID do post é obrigatório." });
            return;
        }
        // Só pega os campos permitidos do body
        const { subjectId, subjectIds: rawSubjectIds, title, description, level, contentType, imageLink, videos, documents, } = req.body;
        const subjectIds = (0, utils_1.normalizeSubjectIds)(rawSubjectIds, subjectId);
        const updateData = {};
        if (subjectIds.length > 0) {
            updateData.subjectIds = subjectIds;
            updateData.subjectId = subjectIds[0];
        }
        if (title !== undefined) {
            updateData.title = typeof title === "string" ? title.trim() : title;
        }
        if (description !== undefined) {
            updateData.description =
                typeof description === "string" ? description.trim() : description;
        }
        if (level !== undefined) {
            updateData.level = typeof level === "string" ? level.trim() : level;
        }
        if (contentType !== undefined)
            updateData.contentType = contentType;
        if (imageLink !== undefined) {
            updateData.imageLink =
                typeof imageLink === "string" ? imageLink.trim() : imageLink;
        }
        if (videos) {
            updateData.videos = videos;
            updateData.documents = undefined; // remove documents se vídeos forem enviados
        }
        if (documents) {
            updateData.documents = documents;
            updateData.videos = undefined; // remove vídeos se documentos forem enviados
        }
        // Atualiza e retorna o documento atualizado
        const updatedPost = await app_1.default.findByIdAndUpdate(postId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedPost) {
            res.status(404).json({ error: "Post não encontrado." });
            return;
        }
        res.status(200).json({ message: "Post atualizado com sucesso!", data: updatedPost });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar o post." });
    }
};
exports.update = update;
