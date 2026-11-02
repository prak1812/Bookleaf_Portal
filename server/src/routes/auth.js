const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');

const router = express.Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');

  const payload = { id: String(user._id), role: user.role, name: user.name };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: '8h' });
  res.json({ token, user: { id: payload.id, name: user.name, email: user.email, role: user.role } });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;