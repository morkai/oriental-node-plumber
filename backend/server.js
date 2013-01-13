var http = require('http');
var express = require('express');
var orientdb = require('orientdb');

app = express();

app.db = new orientdb.GraphDb(
  'plumber',
  new orientdb.Server({host: '127.0.0.1', port: 2424}),
  {user_name: 'plumber', user_password: 'nohax'}
);

app.db.open(function(err)
{
  if (err)
  {
    console.error("Failed to connect to the database: %s", err);
    process.exit(1);
  }

  console.log("Connected to the database");
});

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
