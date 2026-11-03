const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
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
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
app.use(errorHandler);
module.exports = app;