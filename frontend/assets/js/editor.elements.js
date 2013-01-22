(function(app)
{
  app.socket.on('element.created', function addRemoteElement(data)
  {
    app.addElement(data).render(app.editor.$canvas);
  });
})(window.app);
