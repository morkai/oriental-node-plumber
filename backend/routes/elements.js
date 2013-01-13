var Element = require('../models/Element');

app.get('/elements', function(req, res, next)
{
  Element.getAll(function(err, elements)
  {
    if (err) return next(err);

    return res.send(elements.map(Element.toJSON));
  });
});

app.post('/elements', function(req, res, next)
{
  Element.create(req.body, function(err, element)
  {
    if (err) return next(err);

    return res.send(Element.toJSON(element));
  });
});

app.get('/elements/:id', function(req, res, next)
{
  Element.getOne(req.params.id, function(err, element)
  {
    if (err) return next(err);

    if (!element) return res.send(404);

    return res.send(Element.toJSON(element));
  });
});

app.put('/elements/:id', function(req, res, next)
{
  Element.edit(req.params.id, req.body, function(err, element)
  {
    if (err && err.code === 404) return res.send(404);

    if (err) return next(err);

    return res.send(element);
  });
});

app.del('/elements/:id', function(req, res, next)
{
  Element.delete(req.params.id, function(err, element)
  {
    if (err && err.code === 404) return res.send(404);

    if (err) return next(err);

    return res.send(204);
  });
});
