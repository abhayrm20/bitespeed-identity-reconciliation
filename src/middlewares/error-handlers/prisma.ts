import express, { NextFunction, Request, Response } from 'express';

export const prismaConnectionErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err['code'] === 'P1037' || err['code'] === 'P1001') {
    process.kill(process.pid, 'SIGTERM');
  }
  throw err;
};
