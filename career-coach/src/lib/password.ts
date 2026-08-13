import { z } from "zod";

/** Min 8 chars, one uppercase, one digit, one special character. */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_RULES_TEXT =
  "At least 8 characters with one uppercase letter, one number, and one special character.";

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .refine(isValidPassword, { message: PASSWORD_RULES_TEXT });
