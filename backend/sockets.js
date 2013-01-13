var Element = require('./models/Element');

var DEFAULT_SCREEN = 'screen123';

var socketCount = 1;

app.io.sockets.on('connection', function(socket)
{
  socket.name = 'Guest #' + socketCount++;

  app.io.sockets.in(DEFAULT_SCREEN).emit(
    'screen.join',
    [{
      id: socket.id,
      name: socket.name
    }]
  );

  socket.join(DEFAULT_SCREEN);

  socket.emit('screen.join', app.io.sockets.clients(DEFAULT_SCREEN).map(function(joinedSocket)
  {
    return {
      id: joinedSocket.id,
      name: joinedSocket.name
    };
  }));

  socket.on('disconnect', function()
  {
    app.io.sockets.emit('screen.leave', socket.id);
  });

  socket.on('element.dragStart', function onDragStart(rid, x, y)
  {
    socket.broadcast.emit('element.dragStart', socket.id, rid);
  });

  socket.on('element.drag', function onDrag(movedElements)
  {
    socket.broadcast.emit('element.drag', movedElements);
  });

  socket.on('element.dragStop', function onDragStop(rid, x, y, done)
  {
    Element.edit(rid, {x: x, y: y}, function(err)
    {
      if (err)
      {
        console.error("Failed to set element position: %s", err.message);
      }
      else
      {
        socket.broadcast.emit('element.dragStop', rid, x, y);
      }

      done(err);
    });
  });
});
