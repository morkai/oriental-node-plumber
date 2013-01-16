(function(app)
{
  app.socket = io.connect();

  /**
   * @type {String}
   */
  app.socket.id = app.socket.socket.sessionid;

  app.socket.on('connect', function()
  {
    app.socket.id = app.socket.socket.sessionid;

    app.publish('socket.connected', app.socket.id);
  });

  app.socket.on('disconnect', function()
  {
    app.publish('socket.disconnected');
  });

})(window.app);
