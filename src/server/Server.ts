import express from 'express';
import cors from 'cors'; // Importe o pacote cors
import { router } from './routes/routes';
import connectDB from './database/mongoose/app';
import 'dotenv/config';
import {
  assertSecurityConfiguration,
  getAllowedCorsOrigins,
  isAllowedOrigin,
} from './config/security';
import { csrfProtection } from './middlewares/csrf';

const server = express();
assertSecurityConfiguration();
connectDB();

const allowedOrigins = getAllowedCorsOrigins();

server.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem nao permitida pelo CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Biishare-Client'],
}));

server.use(express.json());
server.use(csrfProtection);
server.use(router);

export { server };
