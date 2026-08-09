export const legacyCreator = {
  name: "Saber Academico",
  username: "saber-academico",
  email: "sir.a.l.marques@gmail.com",
} as const;

export const isLegacyCreatorEmail = (email?: string | null) =>
  email?.trim().toLowerCase() === legacyCreator.email;
