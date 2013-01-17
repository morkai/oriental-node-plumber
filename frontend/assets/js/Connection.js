(function(app)
{
  app.Connection = Connection;

  /**
   * @constructor
   * @param {Object} data
   */
  function Connection(data)
  {
    /**
     * @type {String}
     */
    this.id = data.id;

    /**
     * @type {String}
     */
    this.type = data.type;

    /**
     * @type {app.Element}
     */
    this.out = data.out;

    /**
     * @type {app.Element}
     */
    this.in = data.in;

    /**
     * @type {String}
     */
    this.source = data.source;

    /**
     * @type {String}
     */
    this.target = data.target;
  }

})(window.app);
