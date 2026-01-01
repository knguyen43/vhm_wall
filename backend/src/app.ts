import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import apiRouter from './routes';
import { rateLimiter } from './middleware/rateLimiter';
import path from 'path';

dotenv.config();

export const app = express();

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api', rateLimiter);
app.use('/api/v1', apiRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected server error' }
  });
});
