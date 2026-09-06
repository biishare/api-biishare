"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferredLocale = void 0;
const locales_1 = require("../../i18n/locales");
const app_1 = __importDefault(require("../../models/user/app"));
const utils_1 = require("./utils");
const updatePreferredLocale = async (req, res) => {
    var _a;
    try {
        const preferredLocale = (0, locales_1.normalizeContentLocale)((_a = req.body) === null || _a === void 0 ? void 0 : _a.preferredLocale);
        if (!preferredLocale) {
            res.status(400).json({ error: "Idioma invalido." });
            return;
        }
        const user = await app_1.default.findByIdAndUpdate(res.locals.userId, { $set: { preferredLocale } }, { new: true });
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
        res.status(500).json({ error: "Erro ao atualizar idioma." });
    }
};
exports.updatePreferredLocale = updatePreferredLocale;
