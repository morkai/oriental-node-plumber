(function(app)
{
  function createConnection(e)
  {
    var jsPlumbConnection = e.connection;

    var data = {
      type: app.Connection.getTypeFromConnector(jsPlumbConnection.connector),
      out: e.source.attr('data-id'),
      in: e.target.attr('data-id'),
      source: e.sourceEndpoint.getParameter('endpointId'),
      target: e.targetEndpoint.getParameter('endpointId')
    };

    var req = $.ajax({
      type: 'post',
      url: '/connections',
      data: JSON.stringify(data)
    });

    req.fail(function(xhr)
    {
      var err = app.util.xhrError(xhr);

      console.error("Failed to create a connection: %s", err.message);

      jsPlumb.detach(jsPlumbConnection);
    });

    req.done(function(res)
    {
      var connection = app.addConnection(res);

      connection.setUpJsPlumbConnection(jsPlumbConnection);
    });
  }

  function moveConnection(connectionId, e)
  {
    var jsPlumbConnection = e.connection;
    var connection = app.connections[connectionId];

    if (_.isUndefined(connection))
    {
      return;
    }

    var data = {
      action: 'move',
      out: e.source.attr('data-id'),
      in: e.target.attr('data-id'),
      source: e.sourceEndpoint.getParameter('endpointId'),
      target: e.targetEndpoint.getParameter('endpointId')
    };

    var req = $.ajax({
      type: 'put',
      url: '/connections/' + connectionId,
      data: JSON.stringify(data)
    });

    req.fail(function(xhr)
    {
      var err = app.util.xhrError(xhr);

      console.log("Failed to move connection: %s", err.message);

      jsPlumb.detach(jsPlumbConnection);

      connection.createJsPlumbConnection();
    });

    req.done(function(res)
    {
      app.moveConnection(res);
    });
  }

  app.socket.on('connection.created', function(data)
  {
    app.addConnection(data).createJsPlumbConnection();
  });

  jsPlumb.bind('connection', function(e)
  {
    //console.log('jsPlumb#connection', e);

    var connectionId = e.connection.getParameter('connectionId');

    if (_.isUndefined(connectionId))
    {
      createConnection(e);
    }
    else
    {
      moveConnection(connectionId, e);
    }
  });

  jsPlumb.bind('click', function(connection)
  {
    //console.log('jsPlumb#click', connection);
  });

  jsPlumb.bind('dblclick', function(connection)
  {
    //console.log('jsPlumb#dblclick', connection);
  });

  jsPlumb.bind('connectionDrag', function(connection)
  {
    //console.log('jsPlumb#connectionDrag', connection);
  });

  jsPlumb.bind('connectionDragStop', function(connection)
  {
    //console.log('jsPlumb#connectionDragStop', connection);
  });

  jsPlumb.bind('endpointClick', function(endpoint)
  {
    //console.log('jsPlumb#endpointClick', endpoint);
  });

  jsPlumb.bind('endpointDblClick', function(endpoint)
  {
    //console.log('jsPlumb#endpointDblClick', endpoint);
  });
})(window.app);
