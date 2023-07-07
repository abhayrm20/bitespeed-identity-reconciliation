import moment from 'moment-timezone';
moment.tz.setDefault('Asia/Kolkata');

import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { LogLevelIndicators, prismaWrapper } from './services/prisma-wrapper';

import { loggerInstance } from './middlewares/custom-logger';
loggerInstance.initialize();

const start = async () => {
  try {
    ['POSTGRES_URI'].forEach((envVar) => {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} not defined.`);
      }
    });

    await prismaWrapper.connect(LogLevelIndicators.two);

    app.listen(3000, () => {
      console.log('Listening on port 3000!');
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
