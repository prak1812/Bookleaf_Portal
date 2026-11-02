const mongoose = require('mongoose');
const { MONGODB_URL } = require('./env');

async function connect() {
  await mongoose.connect(MONGODB_URL);
  console.log('MongoDB connected');
}

module.exports = { connect, mongoose };