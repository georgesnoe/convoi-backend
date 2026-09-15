import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long"),
  APP_URL: z.url().min(1, "APP_URL is required"),
  SESSION_COOKIE_NAME: z.string().min(1).default("SESSION_COOKIE"),
  SESSION_DURATION_MS: z.number().default(1 * 60 * 60 * 1000), // 1 hour
  SALT_ROUNDS: z.number().min(1).default(10),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
});

export const env = envSchema.parse(Bun.env);
