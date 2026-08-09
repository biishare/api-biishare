"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
const security_1 = require("../config/security");
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const csrfProtection = (req, res, next) => {
    if (!unsafeMethods.has(req.method.toUpperCase())) {
        next();
        return;
    }
    const secFetchSite = req.headers['sec-fetch-site'];
    if (secFetchSite === 'cross-site') {
        res.status(403).json({ error: 'Origem da requisicao nao permitida.' });
        return;
    }
    const origin = req.headers.origin;
    if (origin) {
        if (!(0, security_1.isAllowedOrigin)(origin)) {
            res.status(403).json({ error: 'Origem da requisicao nao permitida.' });
            return;
        }
        next();
        return;
    }
    const referer = req.headers.referer;
    if (referer && !(0, security_1.isAllowedOrigin)(referer)) {
        res.status(403).json({ error: 'Origem da requisicao nao permitida.' });
        return;
    }
    next();
};
exports.csrfProtection = csrfProtection;
