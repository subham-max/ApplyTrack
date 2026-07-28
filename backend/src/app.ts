// src/app.ts
import express from 'express';
import applicationsRouter from './routes/application.routes';
import signupHandler from './routes/auth.routes';

import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

app.use('/applications', applicationsRouter);
app.use('/auth', signupHandler); // assuming you have an auth router

app.use(errorHandler); // must be registered LAST

export default app;