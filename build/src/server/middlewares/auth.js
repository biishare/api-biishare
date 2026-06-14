"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
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
