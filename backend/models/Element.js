var _ = require('lodash');
var NotFoundError = require('../util/NotFoundError');

exports.toJSON = function(element)
{
  element.id = element['@rid'].substr(1);

  delete element['@rid'];
  delete element['@class'];
  delete element['@type'];

  return element;
};

exports.getAll = function(done)
{
  app.db.command("SELECT FROM Element", done);
};

exports.getOne = function(id, done)
{
  app.db.loadRecord('#' + id, done);
};

exports.create = function(data, done)
{
  app.db.createVertex(data, {class: 'Element'}, done);
};

exports.edit = function(elementOrId, data, done)
{
  if (!done) done = _.noop;

  if (typeof elementOrId === 'string')
  {
    exports.getOne(elementOrId, function(err, element)
    {
      if (err) return done(err);

      if (!element) return done(new NotFoundError("Element not found: " + elementOrId));

      exports.edit(element, data, done);
    });
  }
  else
  {
    app.db.save(_.merge(elementOrId, data), done);
  }
};

exports.delete = function(elementOrId, done)
{
  if (typeof elementOrId === 'string')
  {
    exports.getOne(elementOrId, function(err, element)
    {
      if (err) return done(err);

      if (!element) return done(new NotFoundError("Element not found: " + elementOrId));

      exports.delete(element, done);
    });
  }
  else
  {
    app.db.delete(elementOrId, done);
  }
};
