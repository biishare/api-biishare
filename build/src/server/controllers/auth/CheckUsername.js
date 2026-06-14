"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUsername = void 0;
const zod_1 = require("zod");
const app_1 = __importDefault(require("../../models/user/app"));
const username_1 = require("./username");
const usernameAvailabilitySchema = zod_1.z.object({
    username: zod_1.z.string().trim().min(1),
});
const checkUsername = async (req, res) => {
    try {
        const validation = usernameAvailabilitySchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({
                available: false,
                error: "Username invalido.",
            });
            return;
        }
        const username = (0, username_1.normalizeUsername)(validation.data.username);
        if (!(0, username_1.isValidUsername)(username)) {
            res.status(400).json({
                available: false,
                username,
                error: "Username deve ter 3 a 30 caracteres e usar apenas letras, numeros e hifens.",
            });
            return;
        }
        const existingUser = await app_1.default.exists({ username });
        res.status(200).json({
            username,
            available: !existingUser,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            available: false,
            error: "Erro ao verificar username.",
        });
    }
};
exports.checkUsername = checkUsername;
