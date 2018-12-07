/*
 * Primary file for API
 *
 */

const server = require('./lib/server');
const workers = require('./lib/workers');

const app = {

};

app.init = () => {
  // Start the Server
  server.init();

  // Start the workers
  workers.init();
};

app.init();

module.exports = app;