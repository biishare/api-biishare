import express from 'express';
import cors from 'cors'; // Importe o pacote cors
import { router } from './routes/routes';
import connectDB from './database/mongoose/app';
import 'dotenv/config';

const server = express();
connectDB();

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004',
  'http://127.0.0.1:3005',
  'http://127.0.0.1:3006',
  'http://127.0.0.1:3007',
];

const configuredAllowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredAllowedOrigins.length > 0
    ? configuredAllowedOrigins
    : defaultAllowedOrigins;

const isPrivateDevelopmentOrigin = (origin: string) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    const normalizedHostname = hostname.toLowerCase();

    return (
      normalizedHostname === 'localhost' ||
      normalizedHostname === '127.0.0.1' ||
      normalizedHostname === '::1' ||
      /^10\./.test(normalizedHostname) ||
      /^192\.168\./.test(normalizedHostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedHostname)
    );
  } catch {
    return false;
  }
};

server.use(cors({
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      isPrivateDevelopmentOrigin(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem nao permitida pelo CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


server.use(express.json());
server.use(router);

export { server };
