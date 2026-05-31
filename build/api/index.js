"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("../src/server/Server");
const http_1 = require("http");
const httpServer = (0, http_1.createServer)(Server_1.server);
exports.default = (req, res) => {
    httpServer.emit('request', req, res);
};
