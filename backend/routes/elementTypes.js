var ElementType = require('../models/ElementType');

app.get('/elementTypes', function(req, res, next)
{
  ElementType.getAll(function(err, elementTypes)
  {
    if (err) return next(err);

    return res.send(elementTypes);
  });
});
