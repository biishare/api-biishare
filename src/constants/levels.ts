export const LEVEL_IDS = [
  "8classe",
  "9classe",
  "10classe",
  "11classe",
  "12classe",
  "admissaosuperior",
  "admissaoetp",
  "admissaoifp",
] as const;

export type LevelId = typeof LEVEL_IDS[number];
