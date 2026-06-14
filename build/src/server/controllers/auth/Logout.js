"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = void 0;
const utils_1 = require("./utils");
const logout = async (_req, res) => {
    (0, utils_1.clearAuthCookie)(res);
    res.status(200).json({
        message: "Sessao terminada com sucesso!",
    });
};
exports.logout = logout;
