import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'),
  BASE_URL: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  databaseUrl: parsed.data.DATABASE_URL,
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  uploadDir: parsed.data.UPLOAD_DIR,
  maxFileSize: parseInt(parsed.data.MAX_FILE_SIZE, 10),
  baseUrl: parsed.data.BASE_URL,
};
