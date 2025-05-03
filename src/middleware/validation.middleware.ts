import { RequestHandler } from 'express';
const {  validationResult } = require('express-validator');
import { StatusCodes } from 'http-status-codes';

type ErrorItem = {
  msg: string;
  param: string;
  location: string;
  value: any;
};

const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err: ErrorItem) => ({
    [err.param]: err.msg,
  }));

  res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
    errors: extractedErrors,
  });
};

export default validate;
