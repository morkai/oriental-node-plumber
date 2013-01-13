$(function()
{
  var THROTTLE_TIME = 1000 / 60;
  var SOCKET_COLORS = [
    '#8C0', '#F00', '#F90', '#FFEF00',
    'violet', '#444', '#177245', '#08C', '#800020'
  ];
  var GRID = [10, 10];
  var SELECTED_ELEMENT_CLASS = 'element-selected';

  var socket = io.connect();
  var sockets = {};
  var socketCount = 0;

  var $toolbar = $('.editor-toolbar');
  var $canvas = $('.editor-canvas');
  var $editors = $('.editor-editors');
  var $badges = $editors.find('.editor-editors-badges');

  var elementTypes = {};
  var elements = {};
  var selectedElements = [];
  var connections = {};

  var emitElementDrag = _.throttle(
    socket.emit.bind(socket, 'element.drag'),
    THROTTLE_TIME
  );

  function getPositionDifference($el, newPosition)
  {
    var position = $el.position();

    return {
      left: newPosition.left - position.left,
      top: newPosition.top - position.top
    };
  }

  function getNewPosition($el, positionDifference)
  {
    var position = $el.position();

    position.left += positionDifference.left;
    position.top += positionDifference.top;

    return position;
  }

  // TODO: z-index
  var dragOptions = {
    cursor: 'move',
    stack: '.element',
    scrollSensitivity: 100,
    grid: [1, 1],
    start: function(e, ui)
    {
      socket.emit(
        'element.dragStart',
        $(this).attr('data-id'),
        ui.position.left,
        ui.position.top
      );
    },
    drag: function(e, ui)
    {
      var el = this;
      var $el = $(el);
      var movedElements = [];

      movedElements.push({
        id: $el.attr('data-id'),
        left: ui.position.left,
        top: ui.position.top
      });

      if (selectedElements.length < 2
        || selectedElements.indexOf(el) === -1)
      {
        emitElementDrag(movedElements);

        return;
      }

      var positionDifference = getPositionDifference($el, ui.position);

      selectedElements.forEach(function(selectedElement)
      {
        if (selectedElement === el)
        {
          return;
        }

        var $selectedElement = $(selectedElement);
        var newPosition = getNewPosition($selectedElement, positionDifference);

        movedElements.push({
          id: $selectedElement.attr('data-id'),
          left: newPosition.left,
          top: newPosition.top
        });

        $selectedElement.css({
          left: newPosition.left + 'px',
          top: newPosition.top + 'px'
        });
      });

      emitElementDrag(movedElements);
    },
    stop: function(e, ui)
    {
      var $el = $(this);

      socket.emit(
        'element.dragStop',
        $el.attr('data-id'),
        ui.position.left,
        ui.position.top,
        function(err)
        {
          if (err)
          {
            $el.css({
              left: $el.attr('data-left') + 'px',
              top: $el.attr('data-top') + 'px'
            });
          }
          else
          {
            $el.attr('data-left', ui.position.left);
            $el.attr('data-top', ui.position.top);
          }
        }
      );
    }
  };

  socket.on('screen.join', function(joinedSockets)
  {
    joinedSockets.forEach(function(joinedSocket)
    {
      if (joinedSocket.id === socket.socket.sessionid)
      {
        return;
      }

      joinedSocket.color = SOCKET_COLORS.shift();

      sockets[joinedSocket.id] = joinedSocket;

      ++socketCount;

      var $badge = $('<span class="editor-editors-badge">&nbsp;</span>');

      $badge.attr({
        id: 'editor-' + joinedSocket.id,
        title: joinedSocket.name
      });

      $badge.css({
        backgroundColor: joinedSocket.color ? joinedSocket.color : 'grey'
      });

      $badges.append($badge);
    });

    if (socketCount === 0)
    {
      return;
    }

    $editors.find('.editor-editors-count').text(socketCount);
  });

  socket.on('screen.leave', function(sid)
  {
    if (!sockets.hasOwnProperty(sid))
    {
      return;
    }

    var leaver = sockets[sid];

    delete sockets[sid];

    if (leaver.color)
    {
      SOCKET_COLORS.unshift(leaver.color);
    }

    $('#editor-' + sid).remove();

    --socketCount;

    $editors.find('.editor-editors-count').text(socketCount === 0 ? 'No' : socketCount);
  });

  socket.on('element.dragStart', function(sid, rid)
  {
    var element = elements[rid];

    element.$.draggable('option', 'disabled', true);
    element.$.addClass('element-dragged');
    element.$.css({
      outlineColor: sockets[sid].color ? sockets[sid].color : 'grey'
    });
  });

  socket.on('element.drag', function(movedElements)
  {
    movedElements.forEach(function(movedElement)
    {
      var element = elements[movedElement.id];

      if (!element)
      {
        return;
      }

      element.$.css({
        left: movedElement.left + 'px',
        top: movedElement.top + 'px'
      });
    });
  });

  socket.on('element.dragStop', function(rid, x, y)
  {
    var element = elements[rid];

    element.$.removeClass('element-dragged');
    element.$.draggable('option', 'disabled', false);
    element.$.css({
      left: x + 'px',
      top: y + 'px',
      outlineColor: ''
    });
  });

  function addElementType(elementType)
  {
    elementTypes[elementType.id] = elementType;

    elementType.render = function(element)
    {
      element.$ = $(new EJS({url: '/templates/elementTypes/' + elementType.id}).render(element));

      element.$.attr({
        'data-id': element.id,
        'data-top': element.y,
        'data-left': element.x
      });

      element.$.css({
        top: element.y + 'px',
        left: element.x + 'px'
      });

      return element.$;
    };
  }

  function renderElements(elements)
  {
    elements.forEach(renderElement);
  }

  function renderElement(element)
  {
    if (!elementTypes.hasOwnProperty(element.type))
    {
      throw new Error("Unknown element type: " + element.type);
    }

    element.type = elementTypes[element.type];
    element.type.render(element).appendTo($canvas);

    jsPlumb.draggable(element.$, dragOptions);

    elements[element.id] = element;
  }

  //
  jsPlumb.bind('jsPlumbConnection', function(e)
  {
    console.log('jsPlumb#jsPlumbConnection', e);
  });

  jsPlumb.bind('jsPlumbConnectionDetached', function(e)
  {
    console.log('jsPlumb#jsPlumbConnectionDetached', e);
  });

  // Editor toolbar
  $toolbar.find('.editor-toolbar-snap').on('click', function()
  {
    _.defer(toggleSnapToGrid);
  });

  $toolbar.find('.editor-toolbar-grid').on('click', function()
  {
    _.defer(toggleGrid);
  });

  $toolbar.find('.editor-toolbar-grid-sizes').on('click', 'a', function(e)
  {
    e.preventDefault();

    var grid = $(this).attr('data-size').split('x').map(Number);

    if (grid[0] === 0 && grid[1] === 0)
    {
      console.log('TODO: Show custom grid size dialog');
    }
    else
    {
      GRID = grid;
    }

    toggleSnapToGrid();
    toggleGrid();
  });

  function toggleSnapToGrid()
  {
    var grid = [GRID[0], GRID[1]];

    if (!$toolbar.find('.editor-toolbar-snap').hasClass('active'))
    {
      grid[0] = grid[1] = 1;
    }

    dragOptions.grid = grid;

    $('.element').draggable('option', 'grid', grid);
  }

  function toggleGrid()
  {
    var img = 'none';

    if ($toolbar.find('.editor-toolbar-grid').hasClass('active'))
    {
      img = 'url(/grid.svg?w=' + GRID[0] + '&h=' + GRID[1] + ')';
    }

    $canvas.css('background-image', img);
  }

  // Selection management
  $canvas.on('click', '.element', function(e)
  {
    var el = this;
    var $el = $(el);

    if ($el.hasClass(SELECTED_ELEMENT_CLASS))
    {
      if (e.ctrlKey)
      {
        $el.removeClass(SELECTED_ELEMENT_CLASS);

        selectedElements.splice(selectedElements.indexOf(el), 1);
      }
      else
      {
        $(selectedElements).not(el).removeClass(SELECTED_ELEMENT_CLASS);

        selectedElements = [el];
      }
    }
    else
    {
      $el.addClass(SELECTED_ELEMENT_CLASS);

      if (e.ctrlKey)
      {
        selectedElements.push(el);
      }
      else
      {
        $(selectedElements).removeClass(SELECTED_ELEMENT_CLASS);
        selectedElements = [el];
      }
    }

    return false;
  });

  $canvas.on('click', function()
  {
    $(selectedElements).removeClass(SELECTED_ELEMENT_CLASS);
    selectedElements = [];
  });

  $canvas.xselectable({
    filter: '.element',
    cancel: '.element',
    selectedCssClass: SELECTED_ELEMENT_CLASS
  });

  $canvas.on('xselectablestart', function(e, ui)
  {
    selectedElements = [];
  });

  $canvas.on('xselectableselected', function(e, ui)
  {
    console.log('xselectableselected', ui);

    selectedElements = ui.selected;
  });

  $canvas.on('xselectableunselected', function(e, ui)
  {
    console.log('xselectableunselected', ui);

    selectedElements = _.difference(selectedElements,  ui.unselected);
  });

  // Start
  toggleSnapToGrid();
  toggleGrid();

  var loadElementTypesReq = $.ajax({
    url: '/elementTypes',
    success: function(data)
    {
      data.forEach(addElementType);
    }
  });

  var loadElementsReq = $.ajax({
    url: '/elements',
    success: function(data)
    {
      loadElementTypesReq.then(function()
      {
        renderElements(data);
      });
    }
  });
});
