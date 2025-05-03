import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  const statusCode =
    res.statusCode !== StatusCodes.OK
      ? res.statusCode
      : StatusCodes.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export default errorHandler;