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

    /**
     * @private
     * @type {jsPlumb.Connection|null}
     */
    this.jsPlumbConnection = null;
  }

  /**
   * @param {String} type
   * @return {Array}
   */
  Connection.getConnectorFromType = function(type)
  {
    var connector;

    switch (type)
    {
      case 'straight':
        connector = ['Straight'];
        break;

      case 'flowchart':
        connector = ['Flowchart', {stub: 30}];
        break;

      case 'state-machine':
        connector = ['StateMachine'];
        break;

      default:
        connector = ['Bezier'];
        break;
    }

    return connector;
  };

  /**
   * @param {jsPlumb.Connector} connector
   */
  Connection.getTypeFromConnector = function(connector)
  {
    switch (connector.type)
    {
      case 'Straight':
        return 'straight';

      case 'Flowchart':
        return 'flowchart';

      case 'StateMachine':
        return 'state-machine';

      default:
        return 'bezier';
    }
  };

  /**
   * @return {jsPlumb.Connection}
   */
  Connection.prototype.createJsPlumbConnection = function()
  {
    if (this.jsPlumbConnection)
    {
      jsPlumb.detach(this.jsPlumbConnection);
    }

    var jsPlumbConnection = jsPlumb.connect({
      source: this.getSourceEndpoint(),
      target: this.getTargetEndpoint(),
      cssClass: 'element-connection',
      hoverClass: 'element-connection-hover',
      connector: Connection.getConnectorFromType(this.type),
      reattach: true,
      doNotFireConnectionEvent: true
    });

    if (jsPlumbConnection)
    {
      this.setUpJsPlumbConnection(jsPlumbConnection);
    }

    return jsPlumbConnection;
  };

  /**
   * @param {jsPlumb.Connection} jsPlumbConnection
   */
  Connection.prototype.setUpJsPlumbConnection = function(jsPlumbConnection)
  {
    jsPlumbConnection.setParameter('connectionId', this.id);

    this.jsPlumbConnection = jsPlumbConnection;
  };

  /**
   * @return {jsPlumb.Endpoint}
   */
  Connection.prototype.getSourceEndpoint = function()
  {
    return this.out.endpoints[this.source];
  };

  /**
   * @return {jsPlumb.Endpoint}
   */
  Connection.prototype.getTargetEndpoint = function()
  {
    return this.in.endpoints[this.target];
  };

  Connection.prototype.destroy = function()
  {
    if (this.out)
    {
      if (this.out.out)
      {
        this.out.out.splice(this.out.out.indexOf(this), 1);
      }

      this.out = null;
    }

    if (this.in)
    {
      if (this.in.in)
      {
        this.in.in.splice(this.in.in.indexOf(this), 1);
      }

      this.in = null;
    }

    if (this.jsPlumbConnection)
    {
      jsPlumb.detach(this.jsPlumbConnection);

      this.jsPlumbConnection = null;
    }
  };
})(window.app);
