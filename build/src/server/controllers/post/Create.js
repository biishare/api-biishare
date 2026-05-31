"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const create = async (req, res) => {
    try {
        const { subjectId, title, year, level, contentType, imageLink, videos, documents, } = req.body;
        /* ---------- VALIDAÇÕES BASE ---------- */
        if (!subjectId || !title || !year || !level || !contentType || !imageLink) {
            res.status(400).json({
                error: "Campos obrigatórios ausentes.",
            });
            return;
        }
        /* ---------- VALIDAÇÃO POR TIPO ---------- */
        if (contentType === "video") {
            if (!Array.isArray(videos) || videos.length === 0) {
                res.status(400).json({
                    error: "Adicione pelo menos um vídeo.",
                });
                return;
            }
        }
        if (contentType === "document") {
            if (!Array.isArray(documents) || documents.length === 0) {
                res.status(400).json({
                    error: "Adicione pelo menos um documento.",
                });
                return;
            }
            const invalidDoc = documents.find((doc) => typeof doc.totalPages !== "number" || doc.totalPages < 1);
            if (invalidDoc) {
                res.status(400).json({
                    error: "Todo documento deve conter o número total de páginas.",
                });
                return;
            }
        }
        /* ---------- CREATE ---------- */
        const newPost = new app_1.default({
            subjectId,
            title,
            year: Number(year),
            level,
            contentType,
            imageLink,
            ...(contentType === "video" && {
                videos,
                documents: undefined,
            }),
            ...(contentType === "document" && {
                documents,
                videos: undefined,
            }),
        });
        await newPost.save();
        res.status(201).json({
            message: "Post criado com sucesso!",
            data: newPost,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar o post." });
    }
};
exports.create = create;
