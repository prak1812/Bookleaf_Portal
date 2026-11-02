require('dotenv').config();

const required = ['MONGODB_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}

module.exports = {
  port: process.env.PORT || 4000,
  MONGODB_URL: process.env.MONGODB_URL,
  jwtSecret: process.env.JWT_SECRET,
  anthropicKey: process.env.GEMINI_APOI_KEY || null,
  aiModel: process.env.AI_MODEL || 'gemini-3.5-flash',
};