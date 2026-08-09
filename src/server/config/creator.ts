import { getEnvValue } from "./security";

const defaultAutoApproveCreatorEmails = ["tonymarques116@gmail.com"];

export const creatorNameChangeIntervalDays = 30;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getAutoApproveCreatorEmails = () => {
  const configuredEmails = getEnvValue("CREATOR_AUTO_APPROVE_EMAILS")
    ?.split(",")
    .map(normalizeEmail)
    .filter(Boolean);

  if (configuredEmails?.length) {
    return configuredEmails;
  }

  return defaultAutoApproveCreatorEmails;
};

export const isAutoApproveCreatorEmail = (email: string) =>
  getAutoApproveCreatorEmails().includes(normalizeEmail(email));
