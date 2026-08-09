"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCreatorContentFilter = exports.canManageCreatorContent = exports.getAuthenticatedContentOwner = void 0;
const mongoose_1 = require("mongoose");
const legacyCreator_1 = require("../config/legacyCreator");
const app_1 = __importDefault(require("../models/user/app"));
const getAuthenticatedContentOwner = async (res) => {
    const userId = res.locals.userId;
    if (typeof userId !== "string" || !mongoose_1.Types.ObjectId.isValid(userId)) {
        return null;
    }
    const user = await app_1.default.findById(userId).select("email");
    if (!user) {
        return null;
    }
    return {
        _id: new mongoose_1.Types.ObjectId(userId),
        email: user.email,
    };
};
exports.getAuthenticatedContentOwner = getAuthenticatedContentOwner;
const canManageCreatorContent = (creatorId, owner) => {
    if (creatorId) {
        return creatorId.toString() === owner._id.toString();
    }
    return (0, legacyCreator_1.isLegacyCreatorEmail)(owner.email);
};
exports.canManageCreatorContent = canManageCreatorContent;
const buildCreatorContentFilter = (owner) => {
    if ((0, legacyCreator_1.isLegacyCreatorEmail)(owner.email)) {
        return {
            $or: [
                { creatorId: owner._id },
                { creatorId: { $exists: false } },
                { creatorId: null },
            ],
        };
    }
    return { creatorId: owner._id };
};
exports.buildCreatorContentFilter = buildCreatorContentFilter;
