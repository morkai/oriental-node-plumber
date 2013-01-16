var _ = require('lodash');
var NotFoundError = require('../util/NotFoundError');

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
  app.db.createVertex(data, {class: 'Connection'}, done);
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
        return done(new NotFoundError("Connection not found: " + connectionOrId));
      }

      exports.edit(connection, data, done);
    });
  }
  else
  {
    app.db.save(_.merge(connectionOrId, data), done);
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
        return done(new NotFoundError("Connection not found: " + connectionOrId));
      }

      exports.delete(connection, done);
    });
  }
  else
  {
    app.db.delete(connectionOrId, done);
  }
};
