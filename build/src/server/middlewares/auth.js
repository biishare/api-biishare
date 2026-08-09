"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCreator = exports.authenticate = void 0;
const legacyCreator_1 = require("../config/legacyCreator");
const app_1 = __importDefault(require("../models/user/app"));
const utils_1 = require("../controllers/auth/utils");
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    const bearerToken = (header === null || header === void 0 ? void 0 : header.startsWith("Bearer ")) ? header.slice(7) : undefined;
    const token = bearerToken || (0, utils_1.getAuthTokenFromCookieHeader)(req.headers.cookie);
    if (!token) {
        res.status(401).json({ error: "Sessao obrigatoria." });
        return;
    }
    const session = (0, utils_1.verifyAuthToken)(token);
    if (!session) {
        res.status(401).json({ error: "Sessao invalida ou expirada." });
        return;
    }
    res.locals.userId = session.userId;
    next();
};
exports.authenticate = authenticate;
const requireCreator = async (_req, res, next) => {
    try {
        const user = await app_1.default.findById(res.locals.userId).select("creatorStatus email");
        if (!user || (user.creatorStatus !== "approved" && !(0, legacyCreator_1.isLegacyCreatorEmail)(user.email))) {
            res.status(403).json({
                error: "Conta de criador obrigatoria para publicar.",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao validar permissao de criador." });
    }
};
exports.requireCreator = requireCreator;
