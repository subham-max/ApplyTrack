// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signupHandler(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const user = await authService.signup(parsed.data.email, parsed.data.password);
    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Something went wrong' });
  }
}


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const tokens = await authService.login(parsed.data.email, parsed.data.password);
    return res.status(200).json(tokens);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.status(500).json({ error: 'Something went wrong' });
  }
} 


// src/controllers/auth.controller.ts
export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  try {
    const result = await authService.refresh(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}