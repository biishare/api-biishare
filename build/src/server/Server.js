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
const server = (0, express_1.default)();
exports.server = server;
(0, app_1.default)();
server.use((0, cors_1.default)({
    origin: '*', // Permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
server.use(express_1.default.json());
server.use(routes_1.router);
