import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const emailSchema = z.string().trim().email("Invalid email address").max(255);

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export interface PwStrength {
  score: number; // 0-4
  checks: { length: boolean; upper: boolean; lower: boolean; number: boolean };
}

export const evaluatePassword = (pw: string): PwStrength => {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
};
