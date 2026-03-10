import express from 'express';
import cors from 'cors';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import dbConnect from './config/database';
import apiRoutes from './routes/index';
import { sendSMS } from './utils/sendSMS';

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const middleware = [
  logger('dev'),
  cors(),
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

app.get('/test-sms', async (req, res) => {
  console.log('test-sms route');
  try {
    const result = await sendSMS(
      req.body.message || 'Message working from Sohoz Meal App',
      '01790732717'
    );
    if ((result.data as any).success_message) {
      res.status(200).json({ message: (result.data as any).success_message });
    } else {
      res.status(500).json({ message: 'SMS sending failed!' });
      console.log('Reason: ', (result.data as any).error_message);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An error occurred', error });
  }
});

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
