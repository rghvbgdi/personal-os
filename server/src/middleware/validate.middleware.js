import { validationResult } from 'express-validator';
import { error } from '../utils/response.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
};
