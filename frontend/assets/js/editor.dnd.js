(function(app)
{
  var sendElementDrag = _.throttle(
    app.socket.emit.bind(app.socket, 'element.drag'),
    app.DRAG_THROTTLE_TIME
  );

  function sendDraggableEvent(eventName, e, ui, done)
  {
    var isDrag = eventName === 'element.drag';
    var el = e.target;
    var $el = $(el);
    var position = $el.position();
    var positionLeftDifference = ui.position.left - position.left;
    var positionTopDifference = ui.position.top - position.top;

    if (isDrag && positionLeftDifference === 0 && positionTopDifference === 0)
    {
      return;
    }

    var movedElements = [
      $el.attr('data-id'),
      ui.position.left,
      ui.position.top
    ];

    if (app.selectedElements.length < 2 || !_.contains(app.selectedElements, el))
    {
      if (isDrag)
      {
        sendElementDrag(movedElements, done);
      }
      else
      {
        app.socket.emit(eventName, movedElements, done);
      }

      return;
    }

    var elementsToRepaint = [];

    for (var i = 0, l = app.selectedElements.length; i < l; ++i)
    {
      var selectedElement = app.selectedElements[i];

      if (selectedElement === el)
      {
        continue;
      }

      var $selectedElement = $(selectedElement);
      var newPosition = $selectedElement.position();

      newPosition.left += positionLeftDifference;
      newPosition.top += positionTopDifference;

      movedElements.push(
        $selectedElement.attr('data-id'),
        newPosition.left,
        newPosition.top
      );

      $selectedElement.css({
        left: newPosition.left + 'px',
        top: newPosition.top + 'px'
      });

      elementsToRepaint.push($selectedElement);
    }

    if (isDrag)
    {
      sendElementDrag(movedElements, done);
    }
    else
    {
      app.socket.emit(eventName, movedElements, done);
    }

    jsPlumb.repaint(elementsToRepaint);
  }

  app.subscribe('element.dragStarted', function(e, ui)
  {
    sendDraggableEvent('element.dragStart', e, ui);
  });

  app.subscribe('element.dragged', function(e, ui)
  {
    sendDraggableEvent('element.drag', e, ui);
  });

  app.subscribe('element.dragStopped', function(e, ui)
  {
    sendDraggableEvent('element.dragStop', e, ui, function(err, movedElements)
    {
      if (err)
      {
        // TODO: Move elements to the original position
        console.error(err.message || err);

        return;
      }

      for (var i = 0, l = movedElements.length; i < l; i += 3)
      {
        var element = app.elements[movedElements[i]];

        if (_.isUndefined(element))
        {
          continue;
        }

        element.setPositionData(
          movedElements[i + 1],
          movedElements[i + 2]
        );
      }
    });
  });

  app.socket.on('element.dragStarted', function(userId, movedElements)
  {
    var user = app.screen.users[userId];
    var color = user ? user.color : app.SPARE_USER_COLOR;
    var elementsToRepaint = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      var element = app.elements[movedElements[i]];

      if (_.isUndefined(element))
      {
        continue;
      }

      element.$
        .draggable('option', 'disabled', true)
        .addClass('element-dragged')
        .css({
          left: movedElements[i + 1] + 'px',
          top: movedElements[i + 2] + 'px',
          outlineColor: color
        });

      elementsToRepaint.push(element.$);
    }

    jsPlumb.repaint(elementsToRepaint);
  });

  app.socket.on('element.dragged', function(userId, movedElements)
  {
    var user = app.screen.users[userId];
    var color = user ? user.color : app.SPARE_USER_COLOR;
    var elementsToRepaint = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      var element = app.elements[movedElements[i]];

      if (_.isUndefined(element))
      {
        continue;
      }

      element.$.css({
        left: movedElements[i + 1] + 'px',
        top: movedElements[i + 2] + 'px',
        outlineColor: color
      });

      elementsToRepaint.push(element.$);
    }

    jsPlumb.repaint(elementsToRepaint);
  });

  app.socket.on('element.dragStopped', function(userId, movedElements)
  {
    var elementsToRepaint = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      var element = app.elements[movedElements[i]];

      if (_.isUndefined(element))
      {
        continue;
      }

      element.$
        .css({
          left: movedElements[i + 1] + 'px',
          top: movedElements[i + 2] + 'px',
          outlineColor: ''
        })
        .removeClass('element-dragged')
        .draggable('option', 'disabled', false);

      elementsToRepaint.push(element.$);
    }

    jsPlumb.repaint(elementsToRepaint);
  });
})(window.app);
