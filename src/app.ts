import json from 'body-parser';
import express from 'express';
import 'express-async-errors';

import compression from 'compression';
import bearerToken from 'express-bearer-token';
import { prismaConnectionErrorHandler } from './middlewares/error-handlers/prisma';
import { NotFoundError } from './middlewares/errors/not-found-error';
import { errorHandlers } from './middlewares/error-handlers';
import { attachRequestIds } from './middlewares/request-ids';
import { LoggerMiddleware } from './middlewares/logger-middleware';
import { middlewareLogLevels } from './types/enums';

const app = express();
app.set('trust proxy', true);
app.use(json({ limit: '50mb', strict: true }));
app.use(
  bearerToken({
    headerKey: 'Bearer',
  })
);
app.use(compression());

// * Logger
app.use(attachRequestIds({ attributeName: 'x-rid' }));
app.use(
  new LoggerMiddleware('req', middlewareLogLevels.debug, 'x-request-id').logger
);
app.use(
  new LoggerMiddleware('res', middlewareLogLevels.debug, 'x-request-id', app)
    .logger
);

// app.use('/', appRouter);

// * Error handlers
app.use(prismaConnectionErrorHandler);
app.use(errorHandlers);

// * Catch 404
app.all('*', async () => {
  throw new NotFoundError();
});

export { app };
