const HttpError = require('../utils/httpError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new HttpError(400, 'VALIDATION_ERROR', 'Invalid input', result.error.flatten().fieldErrors));
  }
  req.body = result.data;
  next();
};

module.exports = validate;