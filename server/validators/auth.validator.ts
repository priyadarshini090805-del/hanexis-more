import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  role: z.enum(["ADMIN", "TEAM_MEMBER", "VIEWER"]).optional()
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long")
});
