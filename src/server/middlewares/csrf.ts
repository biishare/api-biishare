import { NextFunction, Request, Response } from 'express';

import { isAllowedOrigin } from '../config/security';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!unsafeMethods.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const secFetchSite = req.headers['sec-fetch-site'];

  if (secFetchSite === 'cross-site') {
    res.status(403).json({ error: 'Origem da requisicao nao permitida.' });
    return;
  }

  const origin = req.headers.origin;

  if (origin) {
    if (!isAllowedOrigin(origin)) {
      res.status(403).json({ error: 'Origem da requisicao nao permitida.' });
      return;
    }

    next();
    return;
  }

  const referer = req.headers.referer;

  if (referer && !isAllowedOrigin(referer)) {
    res.status(403).json({ error: 'Origem da requisicao nao permitida.' });
    return;
  }

  next();
};
