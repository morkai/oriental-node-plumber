var format = require('util').format;
var _ = require('lodash');
var step = require('two-step');
var NotFoundError = require('../util/NotFoundError');
var FancyError = require('../util/FancyError');
var ElementType = require('./ElementType');
var Element = require('./Element');

var CONNECTOR_TYPES = [
  'bezier',
  'straight',
  'flowchart',
  'state-machine'
];

/**
 * @param {function(Error?, Array.<Object>?)} done
 */
exports.getAll = function(done)
{
  app.db.command("SELECT FROM Connection", done);
};

/**
 * @param {String} id
 * @param {function(Error?, Object?)} done
 */
exports.getOne = function(id, done)
{
  app.db.loadRecord('#' + id, done);
};

/**
 * @param {Object} data
 * @param {function(Error?, Object?)=} done
 */
exports.create = function(data, done)
{
  if (!_.isFunction(done))
  {
    done = _.noop;
  }

  if (!isValidConnectorType(data.type))
  {
    return done(new FancyError(
      "Invalid connector type: [%s]", data.type
    ));
  }

  var validationOptions = {
    validateSource: true,
    validateTarget: true
  };

  step(
    createGetElementsStep(data),
    createGetEndpointsStep(data, done),
    createGetConnectionsNumbersStep(data, done),
    createValidateConnectionsNumbersStep(validationOptions, data, done),
    function createConnectionStep()
    {
      var hash = _.pick(data, ['type', 'source', 'target']);

      app.db.createEdge(
        this.data.sourceElement,
        this.data.targetElement,
        hash,
        {class: 'Connection'},
        this.val()
      );
    },
    done
  );
};

/**
 * @param {String|Object} connectionOrId
 * @param {Object} data
 * @param {function(Error?, Object?)=} done
 */
exports.edit = function(connectionOrId, data, done)
{
  if (!_.isFunction(done))
  {
    done = _.noop;
  }

  if (_.isString(connectionOrId))
  {
    exports.getOne(connectionOrId, function(err, connection)
    {
      if (err)
      {
        return done(err);
      }

      if (!_.isObject(connection))
      {
        return done(new NotFoundError(
          "Connection not found: [%s]", connectionOrId
        ));
      }

      exports.edit(connection, data, done);
    });
  }
  else
  {
    // TODO Remove uneditable properties

    app.db.save(_.merge(connectionOrId, data), done);
  }
};

/**
 * @param {String|Object} connectionOrId
 * @param {Object} data
 * @param {function(Error?, Object?)=} done
 */
exports.move = function(connectionOrId, data, done)
{
  if (!_.isFunction(done))
  {
    done = _.noop;
  }

  if (_.isString(connectionOrId))
  {
    exports.getOne(connectionOrId, function(err, connection)
    {
      if (err)
      {
        return done(err);
      }

      if (!_.isObject(connection))
      {
        return done(new NotFoundError(
          "Connection not found: [%s]", connectionOrId
        ));
      }

      exports.move(connection, data, done);
    });
  }
  else
  {
    moveConnection(connectionOrId, data, done);
  }
};

/**
 * @param {String|Object} connectionOrId
 * @param {function(Error?, Object?)=} done
 */
exports.delete = function(connectionOrId, done)
{
  if (!_.isFunction(done))
  {
    done = _.noop;
  }

  if (_.isString(connectionOrId))
  {
    exports.getOne(connectionOrId, function(err, connection)
    {
      if (err)
      {
        return done(err);
      }

      if (!_.isObject(connection))
      {
        return done(new NotFoundError(
          "Connection not found: [%s]", connectionOrId
        ));
      }

      exports.delete(connection, done);
    });
  }
  else
  {
    app.db.command(
      format("DELETE EDGE %s", connectionOrId['@rid']),
      done
    );
  }
};

/**
 * @private
 * @param {String} connectorType
 * @return {Boolean}
 */
function isValidConnectorType(connectorType)
{
  return _.contains(CONNECTOR_TYPES, connectorType);
}

/**
 * @private
 * @param {Object} connection
 * @param {Object} data
 * @param {String=} data.in
 * @param {String=} data.out
 * @param {String=} data.source
 * @param {String=} data.target
 * @param {function(Error?)} done
 */
function moveConnection(connection, data, done)
{
  var sourceElementRid = '#' + data.out;
  var targetElementRid = '#' + data.in;

  var sourceElementChanged =
    _.isString(data.out) && sourceElementRid !== connection.out;

  var targetElementChanged =
    _.isString(data.in) && targetElementRid !== connection.in;

  var sourceEndpointChanged =
    _.isString(data.source) && data.source !== connection.source;

  var targetEndpointChanged =
    _.isString(data.target) && data.target !== connection.target;

  if (!sourceElementChanged
    && !targetElementChanged
    && !sourceEndpointChanged
    && !targetEndpointChanged)
  {
    return done();
  }

  var validationOptions = {
    validateSource: sourceElementChanged || sourceEndpointChanged,
    validateTarget: targetElementChanged || targetEndpointChanged
  };

  // TODO Make this transactional
  var steps = [
    createGetElementsStep(data),
    createGetEndpointsStep(data, done),
    createGetConnectionsNumbersStep(data, done),
    createValidateConnectionsNumbersStep(validationOptions, data, done)
  ];

  if (sourceElementChanged)
  {
    steps.push(
      createRemoveFromOldElementStep(
        'out', connection['@rid'], connection.out, done
      ),
      createAddToNewElementStep(
        'out', connection['@rid'], sourceElementRid, done
      )
    );
  }

  if (targetElementChanged)
  {
    steps.push(
      createRemoveFromOldElementStep(
        'in', connection['@rid'], connection.in, done
      ),
      createAddToNewElementStep(
        'in', connection['@rid'], targetElementRid, done
      )
    );
  }

  steps.push(function updateConnectionStep()
  {
    if (sourceElementChanged)
    {
      connection.out = sourceElementRid;
    }

    if (targetElementChanged)
    {
      connection.in = targetElementRid;
    }

    if (sourceEndpointChanged)
    {
      connection.source = data.source;
    }

    if (targetEndpointChanged)
    {
      connection.target = data.target;
    }

    app.db.save(connection, this.val());
  });

  steps.push(done);

  step.apply(null, steps);
}

/**
 * @private
 * @param {Object} data
 * @return {Function}
 */
function createGetElementsStep(data)
{
  return function getElementsStep()
  {
    var sourceCb = this.val();
    var targetCb = this.val();

    Element.getOne(data.out, sourceCb);
    Element.getOne(data.in, targetCb);
  };
}

/**
 * @private
 * @param {Object} data
 * @param {function(Error?)} done
 * @return {Function}
 */
function createGetEndpointsStep(data, done)
{
  return function getEndpointsStep(err, sourceElement, targetElement)
  {
    if (err)
    {
      return this.jumpTo(done, [err]);
    }

    if (!sourceElement)
    {
      return this.jumpTo(done, [new FancyError(
        "Source element does not exist: [%s]", data.out
      )]);
    }

    if (!targetElement)
    {
      return this.jumpTo(done, [new FancyError(
        "Target element does not exist: [%s]", data.in
      )]);
    }

    this.data.sourceElement = sourceElement;
    this.data.targetElement = targetElement;

    var sourceCb = this.val();
    var targetCb = this.val();

    ElementType.getEndpoint(sourceElement.type, data.source, sourceCb);
    ElementType.getEndpoint(targetElement.type, data.target, targetCb);
  };
}

/**
 * @private
 * @param {Object} data
 * @param {function(Error?)} done
 * @return {Function}
 */
function createGetConnectionsNumbersStep(data, done)
{
  return function getConnectionsNumbersStep(
    err, sourceEndpoint, targetEndpoint)
  {
    if (err)
    {
      return this.jumpTo(done, [err]);
    }

    this.data.sourceEndpoint = sourceEndpoint;
    this.data.targetEndpoint = targetEndpoint;

    var sql = "SELECT out[source='%s'].size(), in[target='%s'].size() FROM #%s";

    var sourceSql = format(sql, data.source, data.source, data.out);
    var targetSql = format(sql, data.target, data.target, data.in);

    var sourceCb = this.val();
    var targetCb = this.val();

    app.db.command(sourceSql, sourceCb);
    app.db.command(targetSql, targetCb);
  };
}

/**
 * @private
 * @param {Object} options
 * @param {Boolean=} options.validateSource
 * @param {Boolean=} options.validateTarget
 * @param {Object} data
 * @param {function(Error?)} done
 * @return {Function}
 */
function createValidateConnectionsNumbersStep(options, data, done)
{
  return function validateConnectionsNumbersStep(
    err, sourceResult, targetResult)
  {
    if (err)
    {
      return this.jumpTo(done, [err]);
    }

    if (!Array.isArray(sourceResult) || sourceResult.length === 0)
    {
      return this.jumpTo(done, [new FancyError(
        "Source element does not exist: [%s]", data.out
      )]);
    }

    if (!Array.isArray(targetResult) || targetResult.length === 0)
    {
      return this.jumpTo(done, [new FancyError(
        "Target element does not exist: [%s]", data.in
      )]);
    }

    var sourceMaxConnections = this.data.sourceEndpoint.maxConnections;
    var sourceConnectionCount =
      (sourceResult[0].in || 0) + (sourceResult[0].out || 0);

    if (options.validateSource && sourceConnectionCount >= sourceMaxConnections)
    {
      return this.jumpTo(done, [new FancyError(
        "Connection limit of [%d] was exceeded for endpoint [%s] of element [%s]: [%d]",
        sourceMaxConnections,
        this.data.sourceEndpoint.id,
        this.data.sourceElement['@rid'],
        sourceConnectionCount
      )]);
    }

    var targetMaxConnections = this.data.targetEndpoint.maxConnections;
    var targetConnectionCount =
      (targetResult[0].in || 0) + (targetResult[0].out || 0);

    if (options.validateTarget && targetConnectionCount >= targetMaxConnections)
    {
      return this.jumpTo(done, [new FancyError(
        "Connection limit of [%d] was exceeded for endpoint [%s] of element [%s]: [%d]",
        targetMaxConnections,
        this.data.targetEndpoint.id,
        this.data.targetElement['@rid'],
        targetConnectionCount
      )]);
    }
  };
}

/**
 * @private
 * @param {String} type
 * @param {String} connectionRid
 * @param {String} oldElementRid
 * @param {function(Error?)} done
 * @return {Function}
 */
function createRemoveFromOldElementStep(
  type, connectionRid, oldElementRid, done)
{
  return function removeFromOldElementStep(err)
  {
    if (err)
    {
      return this.jumpTo(done, [err]);
    }

    var sql = format(
      "UPDATE %s REMOVE %s = %s",
      oldElementRid,
      type,
      connectionRid
    );

    app.db.command(sql, this.val());
  };
}

/**
 * @private
 * @param {String} type
 * @param {String} connectionRid
 * @param {String} newElementRid
 * @param {function(Error?)} done
 * @return {Function}
 */
function createAddToNewElementStep(type, connectionRid, newElementRid, done)
{
  return function addNewSourceElementStep(err)
  {
    if (err)
    {
      return this.jumpTo(done, [err]);
    }

    var sql = format(
      "UPDATE %s ADD %s = %s",
      newElementRid,
      type,
      connectionRid
    );

    app.db.command(sql, this.val());
  };
}
