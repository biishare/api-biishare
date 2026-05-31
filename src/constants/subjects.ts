export const SUBJECT_IDS = [
  "fisica",
  "matematica",
  "quimica",
  "biologia",
] as const;

export type SubjectId = typeof SUBJECT_IDS[number];
