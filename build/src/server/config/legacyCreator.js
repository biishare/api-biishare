"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegacyCreatorEmail = exports.legacyCreator = void 0;
exports.legacyCreator = {
    name: "Saber Academico",
    username: "saber-academico",
    email: "sir.a.l.marques@gmail.com",
};
const isLegacyCreatorEmail = (email) => (email === null || email === void 0 ? void 0 : email.trim().toLowerCase()) === exports.legacyCreator.email;
exports.isLegacyCreatorEmail = isLegacyCreatorEmail;
