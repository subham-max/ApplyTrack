// src/routes/auth.routes.ts
import { Router } from 'express';
import { loginHandler, refreshHandler, signupHandler } from '../controllers/auth.controller';

const router = Router();
router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);

export default router;