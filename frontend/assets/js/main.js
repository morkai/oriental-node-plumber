_.noop = function() {};

(function(app)
{
  app.DRAG_THROTTLE_TIME = 1000 / 60;
  app.USER_COLORS = [
    '#88CC00', '#FF0000', '#FF9900', '#FFEF00', '#EE82EE',
    '#444444', '#177245', '#0088CC', '#800020'
  ];
  app.USER_COLOR = '#00BFFF';
  app.SPARE_USER_COLOR = 'grey';

  app.elementTypes = {};
  app.elements = {};
  app.selectedElements = [];
  app.connections = {};

  /**
   * @param {String} file
   * @param {Object} model
   * @return {jQuery}
   */
  app.renderTemplate = function(file, model)
  {
    return $(new EJS({url: '/templates/' + file}).render(model));
  };

  /**
   * @param {Object} data
   * @return {app.ElementType}
   */
  app.addElementType = function(data)
  {
    data.endpoints = Array.isArray(data.endpoints)
      ? createOrReturn(app.ElementType.Endpoint, data.endpoints)
      : [];

    var elementType = new app.ElementType(data);

    app.elementTypes[data.id] = elementType;

    return elementType;
  };

  var connectionsData = [];

  /**
   * @param {Object} data
   * @return {app.Element}
   * @throws {Error}
   */
  app.addElement = function(data)
  {
    var type = data.type;

    if (typeof type === 'string')
    {
      data.type = app.elementTypes[type];
    }

    if (!(data.type instanceof app.ElementType))
    {
      throw new Error("Unknown element type: " + type);
    }

    if (Array.isArray(data.out) && data.out.length > 0)
    {
      if (connectionsData.length === 0)
      {
        _.defer(function()
        {
          connectionsData.forEach(app.addConnection);
          connectionsData = [];
        });
      }

      connectionsData.push.apply(connectionsData, data.out);
    }

    data.out = [];
    data.in = [];

    var element = new app.Element(data);

    app.elements[element.id] = element;

    return element;
  };

  /**
   * @param {Object} data
   * @return {app.Connection}
   * @throws {Error}
   */
  app.addConnection = function(data)
  {
    var sourceElement = _.isString(data.out) ? app.elements[data.out] : data.out;

    if (_.isUndefined(sourceElement))
    {
      throw new Error("Unknown element: " + data.out);
    }

    var targetElement = _.isString(data.in) ? app.elements[data.in] : data.in;

    if (_.isUndefined(targetElement))
    {
      throw new Error("Unknown element: " + data.in);
    }

    data.out = sourceElement;
    data.in = targetElement;

    var connection = new app.Connection(data);

    app.connections[connection.id] = connection;

    sourceElement.out.push(connection);
    targetElement.in.push(connection);

    return connection;
  };

  /**
   * @param {Object} data
   */
  app.moveConnection = function(data)
  {
    var connection = app.connections[data.id];

    if (_.isUndefined(connection))
    {
      throw new Error("Unknown connection: " + data.id);
    }

    if (data.out !== connection.out.id)
    {
      var newSourceElement = app.elements[data.out];

      if (_.isUndefined(newSourceElement))
      {
        throw new Error("Unknown element: " + data.out);
      }

      var oldSourceElement = connection.out;

      oldSourceElement.out.splice(oldSourceElement.out.indexOf(connection));

      newSourceElement.out.push(connection);
    }

    if (data.in !== connection.in.id)
    {
      var newTargetElement = app.elements[data.in];

      if (_.isUndefined(newTargetElement))
      {
        throw new Error("Unknown element: " + data.in);
      }

      var oldTargetElement = connection.in;

      oldTargetElement.in.splice(oldTargetElement.in.indexOf(connection));

      newTargetElement.in.push(connection);
    }

    connection.source = data.source;
    connection.target = data.target;

    return connection;
  };

  /**
   * @private
   * @param {Function} type
   * @param {Array.<Object>} list
   * @return {Array.<Object>}
   */
  function createOrReturn(type, list)
  {
    return list.map(function(data)
    {
      return data instanceof type ? data : new type(data);
    });
  }

  $(function()
  {
    var $editor = $('.editor');
    var $canvas = $editor.find('.editor-canvas');

    var loadElementTypesReq = $.ajax({
      url: '/elementTypes',
      success: function(elementTypesData)
      {
        elementTypesData.forEach(app.addElementType);
      }
    });

    var loadElementsReq = $.ajax({
      url: '/elements',
      data: {connections: 1},
      success: function(elementsData)
      {
        loadElementTypesReq.then(function()
        {
          elementsData.forEach(app.addElement);

          _.defer(function()
          {
            _.invoke(app.elements, 'render', $canvas);
            _.invoke(app.elements, 'renderConnections');
          });
        });
      }
    });
  });
})(window.app = {});
