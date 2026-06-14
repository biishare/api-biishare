export const usernamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeUsername = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const isValidUsername = (value: string) =>
  value.length >= 3 && value.length <= 30 && usernamePattern.test(value);
