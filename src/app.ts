import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import dbConnect from './config/database';
import apiRoutes from './routes/index';

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Restricted CORS
app.use(cors({ origin: ['https://hall.mist.ac.bd', 'http://localhost:5173', 'http://localhost:3000'] }));

// Global rate limiter: 100 requests per 15 minutes per IP
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter rate limiter for auth routes: 20 requests per 15 minutes per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

const middleware = [
  globalRateLimiter,
  logger('dev'),
  cookieParser(),
  express.static('public'),
  express.urlencoded({ extended: true }),
  express.json(),
];

app.use(middleware);

app.get('/', (req, res) => {
  res.send('Welcome to the Sohoz Meal App!');
});

app.use('/api', apiRoutes);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const { initializeCronFromConfig } = require('../cron/mealGenerate');

async function startServer(): Promise<void> {
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection error: ', error);
  }

  await initializeCronFromConfig();

  app.listen(port, () => {
    console.log(`Sohoz Meal app listening on port ${port}!`);
    console.log(`Running on port: ${port}`);
  });
}

startServer();
