import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/custom-error';

export const errorHandlers = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).send({ errors: err.serializeErrors() });
  } else {
    console.log('Unknown error', err);
    res.status(400).send({
      errors: [
        {
          message: 'Something went wrong.',
        },
      ],
    });
  }
};
