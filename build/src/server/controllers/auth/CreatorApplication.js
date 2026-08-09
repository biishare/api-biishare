"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCreatorApplication = void 0;
const creator_1 = require("../../config/creator");
const app_1 = __importDefault(require("../../models/user/app"));
const utils_1 = require("./utils");
const getTrimmedString = (value, maxLength) => typeof value === "string" ? value.trim().slice(0, maxLength) : "";
const applyCreatorApplication = async (req, res) => {
    var _a;
    try {
        const user = await app_1.default.findById(res.locals.userId);
        if (!user) {
            res.status(404).json({ error: "Utilizador nao encontrado." });
            return;
        }
        const userWithUsername = await (0, utils_1.ensureUserUsername)(user);
        const now = new Date();
        if (userWithUsername.creatorStatus === "approved") {
            res.status(200).json({
                message: "Conta de criador ja ativa.",
                creatorStatus: "approved",
                user: (0, utils_1.sanitizeUser)(userWithUsername),
            });
            return;
        }
        if ((0, creator_1.isAutoApproveCreatorEmail)(userWithUsername.email)) {
            userWithUsername.creatorStatus = "approved";
            userWithUsername.creatorAppliedAt = userWithUsername.creatorAppliedAt || now;
            userWithUsername.creatorApprovedAt = now;
            userWithUsername.set("creatorApplication", undefined);
            await userWithUsername.save();
            res.status(200).json({
                message: "Conta de criador ativada.",
                creatorStatus: "approved",
                user: (0, utils_1.sanitizeUser)(userWithUsername),
            });
            return;
        }
        const publicName = getTrimmedString(req.body.publicName, 100);
        const workDescription = getTrimmedString(req.body.workDescription, 500);
        const verificationCode = getTrimmedString(req.body.verificationCode, 40);
        const verificationPhotoName = getTrimmedString(((_a = req.file) === null || _a === void 0 ? void 0 : _a.originalname) || req.body.verificationPhotoName, 220);
        const consentAccepted = req.body.consentAccepted === true || req.body.consentAccepted === "true";
        if (publicName.length < 3 ||
            workDescription.length < 3 ||
            !verificationCode ||
            !verificationPhotoName ||
            !consentAccepted) {
            res.status(400).json({
                error: "Preencha os dados e envie a verificacao para continuar.",
            });
            return;
        }
        userWithUsername.creatorStatus = "pending";
        userWithUsername.creatorAppliedAt = now;
        userWithUsername.set("creatorApprovedAt", undefined);
        userWithUsername.creatorApplication = {
            workDescription,
            publicName,
            verificationCode,
            verificationPhotoName,
            submittedAt: now,
        };
        await userWithUsername.save();
        res.status(202).json({
            message: "Pedido de criador enviado para revisao.",
            creatorStatus: "pending",
            user: (0, utils_1.sanitizeUser)(userWithUsername),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao processar pedido de criador." });
    }
};
exports.applyCreatorApplication = applyCreatorApplication;
