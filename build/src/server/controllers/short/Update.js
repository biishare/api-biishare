"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const mongoose_1 = require("mongoose");
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/shorts/app"));
const Saved_1 = require("./Saved");
const asOptionalString = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const hasImagePayload = (body) => body.imageUrl !== undefined || body.imageUrls !== undefined || body.images !== undefined;
const getImageUrlsFromBody = (body, fallback) => {
    if (!hasImagePayload(body)) {
        return fallback;
    }
    const images = Array.isArray(body.images) ? body.images : [];
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
    const urls = [
        ...images.map((item) => typeof item === "string"
            ? asOptionalString(item)
            : asOptionalString(item === null || item === void 0 ? void 0 : item.url)),
        ...imageUrls.map(asOptionalString),
        asOptionalString(body.imageUrl),
    ];
    return Array.from(new Set(urls.filter((url) => Boolean(url))));
};
const update = async (req, res) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "ID do toque e obrigatorio." });
            return;
        }
        const owner = await (0, creatorOwnership_1.getAuthenticatedContentOwner)(res);
        if (!owner) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const toque = await app_1.default.findById(id);
        if (!toque) {
            res.status(404).json({ error: "Toque nao encontrado." });
            return;
        }
        if (!(0, creatorOwnership_1.canManageCreatorContent)(toque.creatorId, owner)) {
            res.status(403).json({ error: "Nao tens permissao para editar este toque." });
            return;
        }
        const { area, title, description, mediaType, videoUrl, isPublished } = req.body;
        const nextMediaType = mediaType !== null && mediaType !== void 0 ? mediaType : toque.mediaType;
        if (nextMediaType !== "video" && nextMediaType !== "image") {
            res.status(400).json({ error: "Toques aceitam video ou imagem." });
            return;
        }
        if (area !== undefined) {
            toque.area = typeof area === "string" ? area.toLowerCase().trim() : area;
        }
        if (title !== undefined) {
            toque.title = typeof title === "string" ? title.trim() : title;
        }
        if (description !== undefined) {
            toque.description =
                typeof description === "string" ? description.trim() : description;
        }
        const fallbackImageUrls = [
            ...((_a = toque.images) !== null && _a !== void 0 ? _a : []).map((item) => item.url),
            (_b = toque.image) === null || _b === void 0 ? void 0 : _b.url,
        ].filter((url) => Boolean(url));
        const nextVideoUrl = typeof videoUrl === "string" ? videoUrl.trim() : (_c = toque.video) === null || _c === void 0 ? void 0 : _c.url;
        const nextImageUrls = getImageUrlsFromBody(req.body, fallbackImageUrls);
        if (nextMediaType === "video" && !nextVideoUrl) {
            res.status(400).json({ error: "Toque precisa de um link de video." });
            return;
        }
        if (nextMediaType === "image" && nextImageUrls.length === 0) {
            res.status(400).json({ error: "Toque precisa de pelo menos uma imagem." });
            return;
        }
        if (typeof isPublished === "boolean") {
            toque.isPublished = isPublished;
        }
        toque.mediaType = nextMediaType;
        toque.video = nextMediaType === "video" ? { url: nextVideoUrl } : undefined;
        toque.image = nextImageUrls[0] ? { url: nextImageUrls[0] } : undefined;
        toque.images = nextMediaType === "image" ? nextImageUrls.map((url) => ({ url })) : undefined;
        await toque.save();
        res.status(200).json({
            message: "Toque atualizado com sucesso!",
            data: (0, Saved_1.toToquePreview)(toque),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar o toque." });
    }
};
exports.update = update;
