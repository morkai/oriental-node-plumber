var toJSON = require('../util/orient').toJSON;
var Element = require('../models/Element');

app.get('/elements', function(req, res, next)
{
  var getter = req.query.connections === '1'
    ? 'getAllWithConnections'
    : 'getAll';

  Element[getter](function(err, elements)
  {
    if (err) return next(err);

    return res.send(elements.map(toJSON));
  });
});

app.post('/elements', function(req, res, next)
{
  Element.create(req.body, function(err, element)
  {
    if (err) return next(err);

    element = toJSON(element);

    app.io.sockets
      .in(app.DEFAULT_SCREEN)
      .except(req.headers['x-socket-id'])
      .emit('element.created', element);

    return res.send(element);
  });
});

app.del('/elements', function(req, res, next)
{
  var elementIds = req.body;

  if (!Array.isArray(elementIds) || elementIds.length === 0)
  {
    return res.send(400);
  }

  Element.deleteMultiple(elementIds, function(err)
  {
    if (err) return next(err);

    app.io.sockets
      .in(app.DEFAULT_SCREEN)
      .except(req.headers['x-socket-id'])
      .emit('element.deleted', elementIds);

    return res.send(elementIds);
  })
});

app.get('/elements/:id', function(req, res, next)
{
  Element.getOne(req.params.id, function(err, element)
  {
    if (err) return next(err);

    if (!element) return res.send(404);

    return res.send(toJSON(element));
  });
});

app.put('/elements/:id', function(req, res, next)
{
  Element.edit(req.params.id, req.body, function(err, element)
  {
    if (err && err.code === 404) return res.send(404);

    if (err) return next(err);

    return res.send(toJSON(element));
  });
});

app.del('/elements/:id', function(req, res, next)
{
  Element.delete(req.params.id, function(err, element)
  {
    if (err && err.code === 404) return res.send(404);

    if (err) return next(err);

    app.io.sockets
      .in(app.DEFAULT_SCREEN)
      .except(req.headers['x-socket-id'])
      .emit('element.deleted', [req.params.id]);

    return res.send(204);
  });
});
