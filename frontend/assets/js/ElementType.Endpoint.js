(function(app)
{
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

})(window.app);
