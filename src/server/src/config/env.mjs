import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const getEmailConfiguration = () => {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const missing = [
    ...(!apiKey ? ['BREVO_API_KEY'] : []),
    ...(!from ? ['EMAIL_FROM'] : []),
  ];
  if (missing.length) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
    );
  }
  return { apiKey, from };
};

export const validateEnvironment = () => {
  const required = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'CLIENT_URL'];
  if (process.env.NODE_ENV !== 'test') required.push('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL');
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');
  
  getEmailConfiguration();
};

export const getAllowedOrigins = () => {
  const configured = [process.env.CLIENT_URL, ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',')]
    .map((value) => value?.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'production') configured.push('http://localhost:3000', 'http://127.0.0.1:3000');
  return [...new Set(configured)];
};
