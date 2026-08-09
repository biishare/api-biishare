"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAutoApproveCreatorEmail = exports.getAutoApproveCreatorEmails = exports.creatorNameChangeIntervalDays = void 0;
const security_1 = require("./security");
const defaultAutoApproveCreatorEmails = ["tonymarques116@gmail.com"];
exports.creatorNameChangeIntervalDays = 30;
const normalizeEmail = (email) => email.trim().toLowerCase();
const getAutoApproveCreatorEmails = () => {
    var _a;
    const configuredEmails = (_a = (0, security_1.getEnvValue)("CREATOR_AUTO_APPROVE_EMAILS")) === null || _a === void 0 ? void 0 : _a.split(",").map(normalizeEmail).filter(Boolean);
    if (configuredEmails === null || configuredEmails === void 0 ? void 0 : configuredEmails.length) {
        return configuredEmails;
    }
    return defaultAutoApproveCreatorEmails;
};
exports.getAutoApproveCreatorEmails = getAutoApproveCreatorEmails;
const isAutoApproveCreatorEmail = (email) => (0, exports.getAutoApproveCreatorEmails)().includes(normalizeEmail(email));
exports.isAutoApproveCreatorEmail = isAutoApproveCreatorEmail;
