"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSubjectIds = normalizeSubjectIds;
function normalizeSubjectIds(subjectIds, subjectId) {
    const values = Array.isArray(subjectIds) ? [...subjectIds] : [];
    if (typeof subjectId === "string") {
        values.push(subjectId);
    }
    return [
        ...new Set(values
            .filter((value) => typeof value === "string")
            .map(value => value.trim())
            .filter(Boolean)),
    ];
}
