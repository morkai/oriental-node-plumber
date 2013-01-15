$(function()
{
  var DRAG_THROTTLE_TIME = 1000 / 60;
  var SOCKET_COLORS = [
    '#8C0', '#F00', '#F90', '#FFEF00',
    'violet', '#444', '#177245', '#08C', '#800020'
  ];
  var SPARE_COLOR = 'grey';
  var USER_COLOR = '#00BFFF';
  var GRID = [10, 10];
  var SELECTED_ELEMENT_CLASS = 'element-selected';

  _.noop = function() {};

  var socket = io.connect();
  var sockets = {};
  var socketCount = 0;

  var $editor = $('.editor');
  var $toolbar = $editor.find('.editor-toolbar');
  var $canvas = $editor.find('.editor-canvas');
  var $editors = $editor.find('.editor-editors');
  var $editorsCount = $editor.find('.editor-editors-count');
  var $editorsBadges = $editors.find('.editor-editors-badges');
  var $chatUsers = $editor.find('.editor-chat-users');
  var $chatMessages = $editor.find('.editor-chat-messages');
  var $chatText = $editor.find('.editor-chat-text');
  var $currentConnector = $toolbar.find('.editor-toolbar-connector');

  var elementTypes = {};
  var elements = {};
  var selectedElements = [];
  var connections = {};

  function renderTemplate(file, model)
  {
    return $(new EJS({url: '/templates/' + file}).render(model));
  }

  // Editors
  socket.on('connect', function()
  {
    $editorsBadges.empty();
    $chatUsers.empty();

    socketCount = 0;

    $editorsCount.text('No');
    $editor.attr('data-socketCount', 0);
  });

  socket.on('screen.join', function(joinedSockets)
  {
    joinedSockets.forEach(function(joinedSocket)
    {
      if (joinedSocket.id === socket.socket.sessionid)
      {
        return;
      }

      joinedSocket.color = SOCKET_COLORS.shift() || SPARE_COLOR;

      sockets[joinedSocket.id] = joinedSocket;

      ++socketCount;

      var $badge = $('<span class="editor-editors-badge">&nbsp;</span>');

      $badge.attr({
        'data-id': joinedSocket.id,
        title: joinedSocket.name
      });

      $badge.css({
        backgroundColor: joinedSocket.color
      });

      $editorsBadges.append($badge);

      renderTemplate('editor-chat-user', joinedSocket).appendTo($chatUsers);
    });

    if (socketCount === 0)
    {
      return;
    }

    $editorsCount.text(socketCount);
    $editor.attr('data-socketCount', socketCount > 5 ? 5 : socketCount);
  });

  socket.on('screen.leave', function(sid)
  {
    if (!sockets.hasOwnProperty(sid))
    {
      return;
    }

    var leaver = sockets[sid];

    delete sockets[sid];

    if (leaver.color !== SPARE_COLOR)
    {
      SOCKET_COLORS.unshift(leaver.color);
    }

    $editorsBadges.find('.editor-editors-badge[data-id="' + sid + '"]').remove();
    $chatUsers.find('.editor-chat-user[data-id="' + sid + '"]').remove();

    --socketCount;

    $editorsCount.text(socketCount === 0 ? 'No' : socketCount);
    $editor.attr('data-socketCount', socketCount > 5 ? 5 : socketCount);
  });

  // Drag and drop

  var sendElementDrag = _.throttle(
    socket.emit.bind(socket, 'element.drag'),
    DRAG_THROTTLE_TIME
  );

  function emitDraggableEvent(eventName, e, ui, done)
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

    if (selectedElements.length < 2 || !_.contains(selectedElements, el))
    {
      if (isDrag)
      {
        sendElementDrag(movedElements, done);
      }
      else
      {
        socket.emit(eventName, movedElements, done);
      }

      return;
    }

    var elementsToRepaint = [];

    for (var i = 0, l = selectedElements.length; i < l; ++i)
    {
      var selectedElement = selectedElements[i];

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
      socket.emit(eventName, movedElements, done);
    }

    jsPlumb.repaint(elementsToRepaint);
  }

  function setElementPositionData(movedElement)
  {
    var element = elements[movedElement.id];

    if (_.isUndefined(element))
    {
      return;
    }

    element.$.attr({
      'data-left': movedElement.left,
      'data-top': movedElement.top
    });
  }

  // TODO: z-index
  var dragOptions = {
    cursor: 'move',
    stack: '.element',
    scrollSensitivity: 100,
    grid: [1, 1],
    start: function(e, ui)
    {
      emitDraggableEvent('element.dragStart', e, ui);
    },
    drag: function(e, ui)
    {
      emitDraggableEvent('element.drag', e, ui);
    },
    stop: function(e, ui)
    {
      emitDraggableEvent('element.dragStop', e, ui, function(err, movedElements)
      {
        if (err)
        {
          console.error(err);
        }
        else
        {
          movedElements.forEach(setElementPositionData);
        }
      });
    }
  };

  socket.on('element.dragStart', function(sid, movedElements)
  {
    var color = _.isObject(sockets[sid]) ? sockets[sid].color : SPARE_COLOR;
    var elementsToRepaint = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      var element = elements[movedElements[i]];

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

  socket.on('element.drag', function(sid, movedElements)
  {
    var color = _.isObject(sockets[sid]) ? sockets[sid].color : SPARE_COLOR;
    var elementsToRepaint = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      var element = elements[movedElements[i]];

      if (_.isUndefined(element))
      {
        return;
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

  socket.on('element.dragStop', function(sid, movedElements)
  {
    var elementsToRepaint = [];

    for (var i = 0, l = movedElements.length; i < l; i += 3)
    {
      var element = elements[movedElements[i]];

      if (_.isUndefined(element))
      {
        return;
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

  // Canvas

  var referenceEndpointOptions = {
    dropOptions: {
      hoverClass: 'element-endpoint-accept',
      activeClass: 'element-endpoint-valid'
    },
    hoverClass: 'element-endpoint-hover',
    connectorClass: 'element-connection',
    connectorHoverClass: 'element-connection-hover'
  };

  /**
   * @constructor
   * @param {object} data
   */
  function ElementType(data)
  {
    this.id = data.id;

    this.name = data.name;

    this.endpoints = data.endpoints;

    this.templateUrl = '/templates/elementTypes/' + this.id;
  }

  /**
   * @param {object} element
   * @return {jQuery}
   */
  ElementType.prototype.renderElement = function(element)
  {
    element.$ = $(new EJS({url: this.templateUrl}).render(element));

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

  /**
   * @param {object} element
   */
  ElementType.prototype.addEndpoints = function(element)
  {
    if (!_.isObject(element.$))
    {
      return;
    }

    if (!_.isObject(element.endpoints))
    {
      element.endpoints = {};
    }

    this.endpoints.forEach(function(options)
    {
      var cssClass = [
        'element-endpoint',
        'element-' + this.id + '-endpoint',
        'element-' + this.id + '-endpoint-' + options.id
      ];

      var endpoint = jsPlumb.addEndpoint(
        element.$[0], {
          isSource: options.source === true,
          isTarget: options.target === true,
          maxConnections: options.maxConnections || 1,
          anchor: options.anchor,
          cssClass: cssClass.join(' ')
        },
        referenceEndpointOptions
      );

      element.endpoints[options.id] = endpoint;
    }, this);
  };

  function addElementType(elementType)
  {
    elementTypes[elementType.id] = new ElementType(elementType);
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
    element.type.renderElement(element).appendTo($canvas);

    jsPlumb.draggable(element.$, dragOptions);

    element.type.addEndpoints(element);

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
  $toolbar.find('[data-tooltip]').tooltip({
    container: document.body,
    placement: 'top'
  });

  $toolbar.find('.editor-toolbar-connector-values').on('click', 'a', function(e)
  {
    var $selectedConnector = $(this);
    var connectorType = $selectedConnector.attr('data-value');

    $currentConnector
      .val(connectorType)
      .html('<i class="icon-curve-' + connectorType + '"></i>');

    var connector = [];

    switch (connectorType)
    {
      case 'bezier':
        connector = 'Bezier';
        break;

      case 'straight':
        connector = 'Straight';
        break;

      case 'flowchart':
        connector = ['Flowchart', {stub: 30}];
        break;

      case 'state-machine':
        connector = 'StateMachine';
        break;
    }

    jsPlumb.Defaults.Connector = connector;

    e.preventDefault();
  });

  $currentConnector.on('click', function()
  {
    if ($currentConnector.hasClass('disabled'))
    {
      return;
    }

    var newConnectorType = $currentConnector.val();

    console.log('Change a type of the selected connection to: %s', newConnectorType);
  });

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

  $editors.click(function()
  {
    toggleChat();

    return false;
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
  $(document.body).on('keydown', function(e)
  {
    if (!e.ctrlKey || e.keyCode !== 65 || e.target !== document.body)
    {
      return true;
    }

    selectedElements = $canvas
      .find('.element')
      .addClass(SELECTED_ELEMENT_CLASS)
      .get();

    return false;
  });

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
    cancel: '.element, .element-endpoint',
    selectedCssClass: SELECTED_ELEMENT_CLASS,
    boxCssClass: 'editor-selection-box'
  });

  $canvas.on('xselectableselected', function(e, ui)
  {
    selectedElements.push.apply(selectedElements, ui.selected);
  });

  $canvas.on('xselectableunselected', function(e, ui)
  {
    selectedElements = _.difference(selectedElements,  ui.unselected);
  });

  // Chat
  var lastChatMessageUser;

  /**
   * @param {boolean=} state
   */
  function toggleChat(state)
  {
    if (_.isUndefined(state))
    {
      $editor.toggleClass('editor-with-chat');
    }
    else if (state)
    {
      $editor.addClass('editor-with-chat');
    }
    else
    {
      $editor.removeClass('editor-with-chat');
    }

    if ($editor.hasClass('editor-with-chat'))
    {
      $chatText.focus();
    }
    else
    {
      $editors.focus();
    }
  }

  function addChatMessage(data)
  {
    data.followup = lastChatMessageUser === data.user;

    lastChatMessageUser = data.user;

    var userSocket = sockets[data.user];

    if (typeof userSocket === 'undefined')
    {
      if (data.user === socket.socket.sessionid)
      {
        data.color = USER_COLOR;
        data.user = 'Me';
      }
      else
      {
        data.color = SPARE_COLOR;
        data.user = 'Guest';
      }
    }
    else
    {
      data.user = userSocket.name;
      data.color = userSocket.color;
    }

    var scrollToBottom = $chatMessages.height() + $chatMessages[0].scrollTop >= $chatMessages[0].scrollHeight;

    renderTemplate('editor-chat-message', data).appendTo($chatMessages);

    if (scrollToBottom)
    {
      $chatMessages.scrollTop($chatMessages[0].scrollHeight);
    }
  }

  function sendChatMessage(text)
  {
    text = text.trim();

    if (text.length > 0)
    {
      socket.emit('chat.message', {
        text: text
      });

      addChatMessage({
        user: socket.socket.sessionid,
        text: text
      });
    }

    $chatText.val('');
  }

  $(document.body).on('keypress', function(e)
  {
    if (e.which === 32 &&
      (e.target === document.body || e.target === $editors[0]))
    {
      toggleChat(true);

      return false;
    }

    return true;
  });

  $chatText.on('keydown', function(e)
  {
    if (e.which === 27)
    {
      toggleChat(false);

      return false;
    }
    if (e.which === 13)
    {
      sendChatMessage(this.value);

      return false;
    }

    return true;
  });

  socket.on('chat.message', function(data)
  {
    if (data.user !== socket.socket.sessionid)
    {
      addChatMessage(data);
    }
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
