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
    var $editor = $('.editor');
    var $canvas = $editor.find('.editor-canvas');

    /**
     * @param {Object} data
     */
    function addElementType(data)
    {
      app.elementTypes[data.id] = new app.ElementType(data);
    }

    /**
     * @param {Object} data
     */
    function addElement(data)
    {
      if (typeof data.type === 'string')
      {
        data.type = app.elementTypes[data.type];
      }

      var element = new app.Element(data);

      element.render($canvas);

      app.elements[element.id] = element;
    }

    app.subscribe('screen.recounted', function(newCount)
    {
      $editor.attr('data-socketCount', newCount > 5 ? 5 : newCount);
    });

    var loadElementTypesReq = $.ajax({
      url: '/elementTypes',
      success: function(data)
      {
        data.forEach(addElementType);
      }
    });

    var loadElementsReq = $.ajax({
      url: '/elements',
      data: {connections: 1},
      success: function(data)
      {
        loadElementTypesReq.then(function()
        {
          data.forEach(addElement);
        });
      }
    });
  });
})(window.app = {});
