(function(app)
{
  var TEMPLATE_PATH = 'elementTypes/';

  var REFERENCE_ENDPOINT_OPTIONS = {
    dropOptions: {
      hoverClass: 'element-endpoint-accept',
      activeClass: 'element-endpoint-valid',
      accept: function()
      {
        var endpoint = jsPlumb.getEndpoint($(this).attr('data-uuid'));

        return !endpoint.isFull();
      }
    },
    hoverClass: 'element-endpoint-hover',
    connectorClass: 'element-connection',
    connectorHoverClass: 'element-connection-hover'
  };

  app.ElementType = ElementType;

  /**
   * @constructor
   * @param {Object} data
   */
  function ElementType(data)
  {
    /**
     * @type {String}
     */
    this.id = data.id;

    /**
     * @type {String}
     */
    this.name = data.name;

    /**
     * @type {Array.<Object>}
     */
    this.endpoints = data.endpoints.map(function(data)
    {
      return data instanceof app.ElementType.Endpoint
        ? data
        : new app.ElementType.Endpoint(data);
    });
  }

  /**
   * @param {Element} element
   * @return {jQuery}
   */
  ElementType.prototype.renderElement = function(element)
  {
    return app.renderTemplate(TEMPLATE_PATH + this.id, element);
  };

  /**
   * @param {Element} element
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

      var uuid = _.uniqueId('ee');

      var endpoint = jsPlumb.addEndpoint(
        element.$[0], {
          uuid: uuid,
          isSource: options.source === true,
          isTarget: options.target === true,
          maxConnections: options.maxConnections || 1,
          anchor: options.anchor,
          cssClass: cssClass.join(' ')
        },
        REFERENCE_ENDPOINT_OPTIONS
      );

      $(endpoint.canvas).attr('data-uuid', uuid);

      element.endpoints[options.id] = endpoint;
    }, this);
  };
})(window.app);
