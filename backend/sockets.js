var _ = require('lodash');
var step = require('two-step');
var Element = require('./models/Element');

app.DEFAULT_SCREEN = 'screen123';

var sockets = app.io.sockets;
var socketCount = 1;

sockets.on('connection', function(socket)
{
  socket.name = 'Guest #' + socketCount++;

  sockets.in(app.DEFAULT_SCREEN).emit(
    'screen.joined',
    [{
      id: socket.id,
      name: socket.name
    }]
  );

  socket.join(app.DEFAULT_SCREEN);

  socket.emit('screen.joined',
    sockets.clients(app.DEFAULT_SCREEN).map(function(joinedSocket)
    {
      return {
        id: joinedSocket.id,
        name: joinedSocket.name
      };
    })
  );

  socket.on('disconnect', function()
  {
    sockets.in(app.DEFAULT_SCREEN).emit('screen.left', socket.id);
  });

  socket.on('element.dragStart', function onDragStart(movedElements, done)
  {
    sockets.in(app.DEFAULT_SCREEN).except(socket.id).emit(
      'element.dragStarted', socket.id, movedElements
    );

    if (_.isFunction(done))
    {
      done();
    }
  });

  socket.on('element.drag', function onDrag(movedElements, done)
  {
    sockets.in(app.DEFAULT_SCREEN).except(socket.id).emit(
      'element.dragged', socket.id, movedElements
    );

    if (_.isFunction(done))
    {
      done();
    }
  });

  socket.on('element.dragStop', function onDragStop(movedElements, done)
  {
    var steps = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      (function(id, left, top)
      {
        steps.push(function(err)
        {
          if (err)
          {
            throw err;
          }

          var data = {
            left: left,
            top: top
          };

          Element.edit(id, data, this.val());
        });
      })(movedElements[i], movedElements[i + 1], movedElements[i + 2]);
    }

    steps.push(function(err)
    {
      if (err)
      {
        // TODO Inform clients that dragging failed so they can re-enable the elements
        console.error("Failed to set elements positions: %s", err.stack);
      }
      else
      {
        sockets.in(app.DEFAULT_SCREEN).except(socket.id).emit(
          'element.dragStopped', socket.id, movedElements
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
    sockets.in(app.DEFAULT_SCREEN).except(socket.id).emit(
      'chat.messaged', socket.id, data.text
    );
  });
});
