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

  $(function()
  {
    var connectionsData = [];

    var $editor = $('.editor');
    var $canvas = $editor.find('.editor-canvas');

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

    /**
     * @param {Object} data
     * @return {app.ElementType}
     */
    function addElementType(data)
    {
      data.endpoints = Array.isArray(data.endpoints)
        ? createOrReturn(app.ElementType.Endpoint, data.endpoints)
        : [];

      var elementType = new app.ElementType(data);

      app.elementTypes[data.id] = elementType;

      return elementType;
    }

    /**
     * @param {Object} data
     * @return {app.Element}
     * @throws {Error}
     */
    function addElement(data)
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
        connectionsData.push.apply(connectionsData, data.out);
      }

      data.out = [];
      data.in = [];

      var element = new app.Element(data);

      app.elements[element.id] = element;

      return element;
    }

    /**
     * @param {Object} data
     * @return {app.Connection}
     * @throws {Error}
     */
    function addConnection(data)
    {
      var outElement = _.isString(data.out) ? app.elements[data.out] : data.out;

      if (_.isUndefined(outElement))
      {
        throw new Error("Unknown element: " + data.out);
      }

      var inElement = _.isString(data.in) ? app.elements[data.in] : data.in;

      if (_.isUndefined(inElement))
      {
        throw new Error("Unknown element: " + data.in);
      }

      data.out = outElement;
      data.in = inElement;

      var connection = new app.Connection(data);

      app.connections[connection.id] = connection;

      outElement.out.push(connection);
      inElement.in.push(connection);

      return connection;
    }

    var loadElementTypesReq = $.ajax({
      url: '/elementTypes',
      success: function(elementTypesData)
      {
        elementTypesData.forEach(addElementType);
      }
    });

    var loadElementsReq = $.ajax({
      url: '/elements',
      data: {connections: 1},
      success: function(elementsData)
      {
        loadElementTypesReq.then(function()
        {
          elementsData.forEach(addElement);
          connectionsData.forEach(addConnection);
          connectionsData = null;

          _.invoke(app.elements, 'render', $canvas);
        });
      }
    });
  });
})(window.app = {});
