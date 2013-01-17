(function(app)
{
  var REFERENCE_ENDPOINT_OPTIONS = {
    dropOptions: {
      hoverClass: 'element-endpoint-accept',
      activeClass: 'element-endpoint-valid',
      accept: function()
      {
        var endpoint = jsPlumb.getEndpoint($(this).attr('data-uuid'));

        return !endpoint || !endpoint.isFull();
      }
    },
    hoverClass: 'element-endpoint-hover',
    connectorClass: 'element-connection',
    connectorHoverClass: 'element-connection-hover'
  };

  app.ElementType.Endpoint = Endpoint;

  /**
   * @constructor
   * @param {Object} data
   */
  function Endpoint(data)
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
     * @type {Array.<Number>}
     */
    this.anchor = data.anchor;

    /**
     * @type {Boolean}
     */
    this.source = data.source === true;

    /**
     * @type {Boolean}
     */
    this.target = data.target === true;

    /**
     * @type {Number}
     */
    this.maxConnections = data.maxConnections || 1;
  }

  /**
   * @param {Element} element
   * @return {jsPlumb.Endpoint}
   */
  Endpoint.prototype.createForElement = function(element)
  {
    var elementType = element.type;

    var cssClass = [
      'element-endpoint',
      'element-' + elementType.id + '-endpoint',
      'element-' + elementType.id + '-endpoint-' + this.id
    ];

    var uuid = _.uniqueId('ee');

    var jsPlumbEndpoint = jsPlumb.addEndpoint(
      element.$[0], {
        uuid: uuid,
        isSource: this.source,
        isTarget: this.target,
        maxConnections: this.maxConnections,
        anchor: this.anchor,
        cssClass: cssClass.join(' ')
      },
      REFERENCE_ENDPOINT_OPTIONS
    );

    $(jsPlumbEndpoint.canvas).attr('data-uuid', uuid);

    return jsPlumbEndpoint;
  };

})(window.app);
