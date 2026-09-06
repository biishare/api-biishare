"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImages = void 0;
const app_1 = __importDefault(require("../../models/user/app"));
const cloudinary_1 = require("../../services/cloudinary");
const utils_1 = require("./utils");
const uploadProfileImages = async (req, res) => {
    var _a, _b;
    try {
        const files = req.files;
        const avatar = (_a = files === null || files === void 0 ? void 0 : files.avatar) === null || _a === void 0 ? void 0 : _a[0];
        const cover = (_b = files === null || files === void 0 ? void 0 : files.cover) === null || _b === void 0 ? void 0 : _b[0];
        if (!avatar && !cover) {
            res.status(400).json({
                error: "Envie pelo menos uma imagem.",
            });
            return;
        }
        const user = await app_1.default.findById(res.locals.userId);
        if (!user) {
            res.status(404).json({ error: "Utilizador nao encontrado." });
            return;
        }
        if (avatar) {
            user.avatarUrl = await (0, cloudinary_1.uploadProfileImageToCloudinary)({
                file: avatar,
                slot: "avatar",
                userId: user._id.toString(),
            });
        }
        if (cover) {
            user.coverUrl = await (0, cloudinary_1.uploadProfileImageToCloudinary)({
                file: cover,
                slot: "cover",
                userId: user._id.toString(),
            });
        }
        await user.save();
        res.status(200).json({
            message: "Imagens do perfil atualizadas com sucesso!",
            user: (0, utils_1.sanitizeUser)(user),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: (error instanceof Error ? error.message : undefined) || "Erro ao atualizar imagens do perfil.",
        });
    }
};
exports.uploadProfileImages = uploadProfileImages;
