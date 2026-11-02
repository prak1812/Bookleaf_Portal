const { Schema, model } = require('mongoose');
const { toJSON } = require('./shared');

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['author', 'admin'], required: true },
}, { timestamps: true, toJSON });

module.exports = model('User', userSchema);