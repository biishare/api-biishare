"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPublicationMedia = void 0;
const mongoose_1 = require("mongoose");
const cloudinary_1 = require("../../services/cloudinary");
const uploadPublicationMedia = async (req, res) => {
    try {
        const file = req.file;
        const userId = res.locals.userId;
        if (typeof userId !== "string" || !mongoose_1.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!file) {
            res.status(400).json({ error: "Seleciona um ficheiro." });
            return;
        }
        const data = await (0, cloudinary_1.uploadPublicationMediaToCloudinary)({ file, userId });
        res.status(201).json({ data });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            error: (error instanceof Error ? error.message : undefined) || "Nao foi possivel carregar o ficheiro.",
        });
    }
};
exports.uploadPublicationMedia = uploadPublicationMedia;
