var format = require('util').format;
var _ = require('lodash');
var NotFoundError = require('../util/NotFoundError');
var isRid = require('../util/orient').isRid;

/**
 * @param {function(Error?, Array.<Object>?)} done
 */
exports.getAll = function(done)
{
  app.db.command("SELECT FROM Element", done);
};

/**
 * @param {function(Error?, Array.<Object>?)} done
 */
exports.getAllWithConnections = function(done)
{
  app.db.command(
    "SELECT @rid, name, type, top, left, out FROM Element",
    {fetchPlan: 'out:1'},
    done
  );
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
  app.db.createVertex(data, {class: 'Element'}, done);
};

/**
 * @param {String|Object} elementOrId
 * @param {Object} data
 * @param {function(Error?, Object?)=} done
 */
exports.edit = function(elementOrId, data, done)
{
  if (!_.isFunction(done))
  {
    done = _.noop;
  }

  if (_.isString(elementOrId))
  {
    exports.getOne(elementOrId, function(err, element)
    {
      if (err)
      {
        return done(err);
      }

      if (!_.isObject(element))
      {
        return done(new NotFoundError("Element not found: " + elementOrId));
      }

      exports.edit(element, data, done);
    });
  }
  else
  {
    app.db.save(_.merge(elementOrId, data), done);
  }
};

/**
 * @param {String|Object} elementOrId
 * @param {function(Error?, Object?)=} done
 */
exports.delete = function(elementOrId, done)
{
  if (!_.isFunction(done))
  {
    done = _.noop;
  }

  if (_.isString(elementOrId))
  {
    exports.getOne(elementOrId, function(err, element)
    {
      if (err)
      {
        return done(err);
      }

      if (!_.isObject(element))
      {
        return done(new NotFoundError("Element not found: " + elementOrId));
      }

      exports.delete(element, done);
    });
  }
  else
  {
    app.db.delete(elementOrId, done);
  }
};

/**
 * @param {Array.<String>} elementIds
 * @param {function(Error?)=} done
 */
exports.deleteMultiple = function(elementIds, done)
{
  var elementRids = elementIds
    .map(function(elementId) { return '#' + elementId; })
    .filter(isRid);

  if (elementRids.length === 0)
  {
    return done && done(null, 0);
  }

  var sql = format(
    "DELETE VERTEX Element WHERE @rid IN [%s]",
    elementRids.join(',')
  );

  app.db.command(sql, function(err, result)
  {
    if (err)
    {
      return done(err);
    }

    if (_.isObject(result) && _.isNumber(result.value))
    {
      return done(null, result.value);
    }

    return done(null, -1);
  });
};
