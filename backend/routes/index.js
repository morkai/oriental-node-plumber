app.get('/ping', function(req, res)
{
  res.type('text/plain');
  res.send(Date.now());
});

app.get('/', function(req, res)
{
  res.sendfile('index.html', {root: app.get('static directory')});
});

app.get('/grid.svg', function(req, res)
{
  var width = parseInt(req.query.w) || 20;
  var height = parseInt(req.query.h) || 20;
  var color = req.query.c || '#CCC';

  res.contentType('image/svg+xml');

  if (width > 25 || height > 25)
  {
    res.send('\
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + width + '" height="' + height + '">\
  <line x1="' + width + '" y1="0" x2="' + width + '" y2="' + height + '" style="stroke: ' + color + '" />\
  <line x1="0" y1="' + height + '" x2="' + width + '" y2="' + height + '" style="stroke: ' + color + '" />\
</svg>\
  ');
  }
  else
  {
    res.send('\
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + width + '" height="' + height + '">\
  <line x1="0" y1="0" x2="1" y2="1" style="stroke: ' + color + '" />\
</svg>\
  ');
  }
});

require('./elementTypes');
require('./elements');
require('./connections');
