import express, { Request, Response } from 'express';
import json from 'body-parser';
import 'express-async-errors';

import bearerToken from 'express-bearer-token';
import compression from 'compression';

const app = express();
app.set('trust proxy', true);
app.use(json({ limit: '50mb', strict: true }));
app.use(
  bearerToken({
    headerKey: 'Bearer',
  })
);
app.use(compression());

// app.use('/', appRouter);

app.all('*', async (req: Request, res: Response) => {
  res.status(404).send('Not found');
});

export { app };
