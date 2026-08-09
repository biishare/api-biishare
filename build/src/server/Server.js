"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors")); // Importe o pacote cors
const routes_1 = require("./routes/routes");
const app_1 = __importDefault(require("./database/mongoose/app"));
require("dotenv/config");
const security_1 = require("./config/security");
const csrf_1 = require("./middlewares/csrf");
const server = (0, express_1.default)();
exports.server = server;
(0, security_1.assertSecurityConfiguration)();
(0, app_1.default)();
const allowedOrigins = (0, security_1.getAllowedCorsOrigins)();
server.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || (0, security_1.isAllowedOrigin)(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Origem nao permitida pelo CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Biishare-Client'],
}));
server.use(express_1.default.json());
server.use(csrf_1.csrfProtection);
server.use(routes_1.router);
