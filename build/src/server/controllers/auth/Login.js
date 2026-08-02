"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const zod_1 = require("zod");
const app_1 = __importDefault(require("../../models/user/app"));
const utils_1 = require("./utils");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(6),
});
const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: "Dados de login invalidos.",
                details: validation.error.flatten().fieldErrors,
            });
            return;
        }
        const { email, password } = validation.data;
        const user = await app_1.default.findOne({ email }).select("+passwordHash");
        if (!user ||
            !user.passwordHash ||
            !(await (0, utils_1.verifyPassword)(password, user.passwordHash))) {
            res.status(401).json({
                error: "Email ou palavra-passe invalidos.",
            });
            return;
        }
        const userWithUsername = await (0, utils_1.ensureUserUsername)(user);
        const token = (0, utils_1.createAuthToken)(userWithUsername);
        (0, utils_1.setAuthCookie)(res, token);
        res.status(200).json({
            message: "Sessao iniciada com sucesso!",
            user: (0, utils_1.sanitizeUser)(userWithUsername),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao iniciar sessao." });
    }
};
exports.login = login;
