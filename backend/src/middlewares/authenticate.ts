 // src/middlewares/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export interface AuthPayload {
  sub: string;
  email: string;
}

// Extend Express's Request type so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as AuthPayload;
    req.user = payload;
    next(); // hand off to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}