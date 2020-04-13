const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const favicon = require('serve-favicon');


const BackendController = require('./backend_js/backend_controller.js');

app.use(express.static('public'));
app.use(favicon(__dirname + '/public/favicon.ico'));
const controller = new BackendController(io);
controller.initIO();
if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}
