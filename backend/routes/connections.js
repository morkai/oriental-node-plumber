var toJSON = require('../util/orient').toJSON;
var Connection = require('../models/Connection');

app.get('/connections', function(req, res, next)
{
  Connection.getAll(function(err, connections)
  {
    if (err) return next(err);

    return res.send(connections.map(toJSON));
  });
});

app.post('/connections', function(req, res, next)
{
  Connection.create(req.body, function(err, connection)
  {
    if (err) return next(err);

    return res.send(toJSON(connection));
  });
});

app.get('/connections/:id', function(req, res, next)
{
  Connection.getOne(req.params.id, function(err, connection)
  {
    if (err) return next(err);

    if (!connection) return res.send(404);

    return res.send(toJSON(connection));
  });
});

app.put('/connections/:id', function(req, res, next)
{
  switch (req.body.action)
  {
    case 'move':
      Connection.move(req.params.id, req.body, function(err, connection)
      {
        if (err && err.code === 404) return res.send(404);

        if (err) return next(err);

        return res.send(toJSON(connection));
      });
      break;

    default:
      Connection.edit(req.params.id, req.body, function(err, connection)
      {
        if (err && err.code === 404) return res.send(404);

        if (err) return next(err);

        return res.send(toJSON(connection));
      });
      break;
  }

});

app.del('/connections/:id', function(req, res, next)
{
  Connection.delete(req.params.id, function(err)
  {
    if (err && err.code === 404) return res.send(404);

    if (err) return next(err);

    return res.send(204);
  });
});
