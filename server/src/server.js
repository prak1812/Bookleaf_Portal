const { port } = require('./config/env');
const { connect } = require('./config/db');
const app = require('./app');


connect()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Could not start the server:', err.message);
    process.exit(1);
  });