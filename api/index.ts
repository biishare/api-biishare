import { VercelRequest, VercelResponse } from '@vercel/node';
import { server } from '../src/server/Server';
import { createServer } from 'http';

const httpServer = createServer(server);

export default (req: VercelRequest, res: VercelResponse) => {
  httpServer.emit('request', req, res);
};
