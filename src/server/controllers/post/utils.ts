export function normalizeSubjectIds(subjectIds: unknown, subjectId?: unknown) {
  const values = Array.isArray(subjectIds) ? [...subjectIds] : [];

  if (typeof subjectId === "string") {
    values.push(subjectId);
  }

  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map(value => value.trim())
        .filter(Boolean)
    ),
  ];
}
