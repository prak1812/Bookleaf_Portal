const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const HttpError = require('../utils/httpError');

// Fills req.user or rejects with 401.
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'UNAUTHENTICATED', 'Missing login token'));
  try {
    req.user = jwt.verify(token, jwtSecret); // { id, role, name }
    next();
  } catch (err) {
    next(new HttpError(401, 'INVALID_TOKEN', 'Login expired or invalid, please sign in again'));
  }
};

// Are you allowed? Use after requireAuth.
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : next(new HttpError(403, 'FORBIDDEN', 'You do not have access to this resource'));

module.exports = { requireAuth, requireRole };