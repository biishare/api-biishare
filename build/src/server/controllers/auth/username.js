"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUsername = exports.normalizeUsername = exports.usernamePattern = void 0;
exports.usernamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const normalizeUsername = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
exports.normalizeUsername = normalizeUsername;
const isValidUsername = (value) => value.length >= 3 && value.length <= 30 && exports.usernamePattern.test(value);
exports.isValidUsername = isValidUsername;
