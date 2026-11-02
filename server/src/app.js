const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

 app.use('/api/auth', require('./routes/auth'));
 app.use('/api/books', require('./routes/books'));
 app.use('/api/tickets', require('./routes/tickets'));

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;