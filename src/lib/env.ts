import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('EcoGuide AI'),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  API_SECRET_KEY: z.string().min(1).optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(', ')}`)
      .join('\n');

    throw new Error(
      `❌ Invalid environment variables:\n${message}\n\nPlease check your .env file.`,
    );
  }

  return parsed.data;
}

function validateServerEnv() {
  if (typeof window !== 'undefined') {
    return {} as z.infer<typeof serverEnvSchema>;
  }

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    API_SECRET_KEY: process.env.API_SECRET_KEY,
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(', ')}`)
      .join('\n');

    throw new Error(
      `❌ Invalid server environment variables:\n${message}\n\nPlease check your .env file.`,
    );
  }

  return parsed.data;
}

export const env = validateEnv();
export const serverEnv = validateServerEnv();
