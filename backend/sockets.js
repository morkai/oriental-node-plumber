var _ = require('lodash');
var step = require('step');
var Element = require('./models/Element');

var DEFAULT_SCREEN = 'screen123';

var sockets = app.io.sockets;
var socketCount = 1;

sockets.on('connection', function(socket)
{
  socket.name = 'Guest #' + socketCount++;

  sockets.in(DEFAULT_SCREEN).emit(
    'screen.join',
    [{
      id: socket.id,
      name: socket.name
    }]
  );

  socket.join(DEFAULT_SCREEN);

  socket.emit('screen.join', sockets.clients(DEFAULT_SCREEN).map(function(joinedSocket)
  {
    return {
      id: joinedSocket.id,
      name: joinedSocket.name
    };
  }));

  socket.on('disconnect', function()
  {
    sockets.in(DEFAULT_SCREEN).emit('screen.leave', socket.id);
  });

  socket.on('element.dragStart', function onDragStart(movedElements, done)
  {
    sockets.in(DEFAULT_SCREEN).except(socket.id).emit(
      'element.dragStart', socket.id, movedElements
    );

    if (_.isFunction(done))
    {
      done();
    }
  });

  socket.on('element.drag', function onDrag(movedElements, done)
  {
    sockets.in(DEFAULT_SCREEN).except(socket.id).emit(
      'element.drag', socket.id, movedElements
    );

    if (_.isFunction(done))
    {
      done();
    }
  });

  socket.on('element.dragStop', function onDragStop(movedElements, done)
  {
    var steps = [];

    movedElements.forEach(function(movedElement)
    {
      steps.push(function(err)
      {
        if (err)
        {
          throw err;
        }

        var data = {
          x: movedElement.left,
          y: movedElement.top
        };

        Element.edit(movedElement.id, data, this);
      });
    });

    steps.push(function(err)
    {
      if (err)
      {
        console.error("Failed to set elements positions: %s", err.message);
      }
      else
      {
        sockets.in(DEFAULT_SCREEN).except(socket.id).emit(
          'element.dragStop', socket.id, movedElements
        );
      }

      if (_.isFunction(done))
      {
        done(err, movedElements);
      }
    });

    step.apply(null, steps);
  });

  socket.on('chat.message', function onChatMessage(data)
  {
    sockets.in(DEFAULT_SCREEN).except(socket.id).emit('chat.message', {
      user: socket.id,
      text: data.text
    });
  });
});
