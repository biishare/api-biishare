"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const zod_1 = require("zod");
const app_1 = __importDefault(require("../../models/user/app"));
const utils_1 = require("./utils");
const username_1 = require("./username");
const registerSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(3).max(100),
    username: zod_1.z.string().trim().min(3).max(30),
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(6),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
});
const register = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: "Dados de registo invalidos.",
                details: validation.error.flatten().fieldErrors,
            });
            return;
        }
        const { name, email, password } = validation.data;
        const username = (0, username_1.normalizeUsername)(validation.data.username);
        if (!(0, username_1.isValidUsername)(username)) {
            res.status(400).json({
                error: "Username deve ter 3 a 30 caracteres e usar apenas letras, numeros e hifens.",
            });
            return;
        }
        const existingUser = await app_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.email) === email) {
            res.status(409).json({
                error: "Ja existe uma conta com este email.",
            });
            return;
        }
        if ((existingUser === null || existingUser === void 0 ? void 0 : existingUser.username) === username) {
            res.status(409).json({
                error: "Este username ja esta em uso.",
            });
            return;
        }
        const user = await app_1.default.create({
            name,
            username,
            email,
            passwordHash: await (0, utils_1.hashPassword)(password),
        });
        const token = (0, utils_1.createAuthToken)(user);
        (0, utils_1.setAuthCookie)(res, token);
        res.status(201).json({
            message: "Conta criada com sucesso!",
            token,
            user: (0, utils_1.sanitizeUser)(user),
        });
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            const duplicatedField = Object.keys(error.keyPattern || {})[0];
            res.status(409).json({
                error: duplicatedField === "username"
                    ? "Este username ja esta em uso."
                    : "Ja existe uma conta com este email.",
            });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Erro ao criar a conta." });
    }
};
exports.register = register;
