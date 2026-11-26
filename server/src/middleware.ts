import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtSecret } from './config.js';

export type AuthUser = { id: number; role: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Belum login' });
  }
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret);
    if (typeof payload === 'string' || !payload.sub || typeof payload['role'] !== 'string') {
      return res.status(401).json({ message: 'Token tidak valid' });
    }
    res.locals['user'] = { id: Number(payload.sub), role: payload['role'] } as AuthUser;
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}

export function requireRole(...roles: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals['user'] as AuthUser | undefined;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Tidak punya akses' });
    }
    next();
  };
}