import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development_secret_change_me',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tictactoe_realtime',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  useMemoryMongo: String(process.env.USE_MEMORY_MONGO || 'false').toLowerCase() === 'true',
};
