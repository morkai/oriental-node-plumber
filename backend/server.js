var http = require('http');
var express = require('express');

app = express();

require('./db');

app.httpServer = http.createServer(app);
app.httpServer.listen(3000, function()
{
  console.log("HTTP server listening on port %d", app.httpServer.address().port);
});

app.io = require('socket.io').listen(app.httpServer, {
  log: false
});

app.set('static directory', __dirname + '/../frontend');
app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');

app.use(express.bodyParser());
app.use(app.router);
app.use(express.static(app.get('static directory')));

app.configure('development', function()
{
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

app.configure('production', function()
{
  app.use(express.errorHandler());
});

require('./routes');
require('./sockets');
