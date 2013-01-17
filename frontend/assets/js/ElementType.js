(function(app)
{
  var TEMPLATE_PATH = 'elementTypes/';

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

    this.endpoints.forEach(function(endpoint)
    {
      element.endpoints[endpoint.id] = endpoint.createForElement(element);
    });
  };
})(window.app);
