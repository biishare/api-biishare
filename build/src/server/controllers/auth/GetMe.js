"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = void 0;
const app_1 = __importDefault(require("../../models/user/app"));
const utils_1 = require("./utils");
const getMe = async (_req, res) => {
    try {
        const user = await app_1.default.findById(res.locals.userId);
        if (!user) {
            res.status(404).json({ error: "Utilizador nao encontrado." });
            return;
        }
        const userWithUsername = await (0, utils_1.ensureUserUsername)(user);
        res.status(200).json({
            user: (0, utils_1.sanitizeUser)(userWithUsername),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao carregar perfil." });
    }
};
exports.getMe = getMe;
