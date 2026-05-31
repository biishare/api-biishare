import express from 'express';
import cors from 'cors'; // Importe o pacote cors
import { router } from './routes/routes';
import connectDB from './database/mongoose/app';
import 'dotenv/config';

const server = express();
connectDB();

server.use(cors({
  origin: '*', // Permite qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


server.use(express.json());
server.use(router);

export { server };