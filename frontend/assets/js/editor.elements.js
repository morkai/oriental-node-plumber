(function(app)
{
  app.socket.on('element.created', function(data)
  {
    app.addElement(data).render(app.editor.$canvas);
  });
})(window.app);
