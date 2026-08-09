"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPostResponse = void 0;
const mongoose_1 = require("mongoose");
const legacyCreator_1 = require("../../config/legacyCreator");
const toPlainRecord = (value) => {
    if (!value || typeof value !== "object") {
        return {};
    }
    const maybeDocument = value;
    if (typeof maybeDocument.toObject === "function") {
        return maybeDocument.toObject();
    }
    return value;
};
const stringifyId = (value) => {
    if (!value) {
        return undefined;
    }
    if (value instanceof mongoose_1.Types.ObjectId) {
        return value.toString();
    }
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "object" && "_id" in value) {
        return stringifyId(value._id);
    }
    return String(value);
};
const asOptionalString = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const toCreatorSummary = (value) => {
    if (!value || value instanceof mongoose_1.Types.ObjectId || typeof value === "string") {
        return undefined;
    }
    const creator = toPlainRecord(value);
    const id = stringifyId(creator._id);
    const name = asOptionalString(creator.name);
    if (!id || !name) {
        return undefined;
    }
    const summary = { id, name };
    const username = asOptionalString(creator.username);
    const avatarUrl = asOptionalString(creator.avatarUrl);
    const email = asOptionalString(creator.email);
    if (username) {
        summary.username = username;
    }
    if (avatarUrl) {
        summary.avatarUrl = avatarUrl;
    }
    if (email) {
        summary.email = email;
    }
    return summary;
};
const getLegacyCreatorSummary = () => ({
    id: "legacy-saber-academico",
    name: legacyCreator_1.legacyCreator.name,
    username: legacyCreator_1.legacyCreator.username,
    email: legacyCreator_1.legacyCreator.email,
});
const toPostResponse = (post) => {
    const plainPost = toPlainRecord(post);
    const creatorId = stringifyId(plainPost.creatorId);
    const creator = toCreatorSummary(plainPost.creatorId);
    return {
        ...plainPost,
        _id: stringifyId(plainPost._id),
        creatorId,
        creator: creator !== null && creator !== void 0 ? creator : (!creatorId ? getLegacyCreatorSummary() : undefined),
    };
};
exports.toPostResponse = toPostResponse;
