(function(app)
{
  app.screen = {};

  /**
   * @type {Number}
   */
  app.screen.userCount = 0;

  /**
   * @type {Object.<String, Object>}
   */
  app.screen.users = {};

  /**
   * @private
   * @param {Object} user
   */
  function reclaimColor(user)
  {
    if (user.color !== app.SPARE_USER_COLOR)
    {
      app.USER_COLORS.unshift(user.color);
    }
  }

  app.subscribe('socket.connected', function()
  {
    app.screen.userCount = 0;

    _.each(app.screen.users, reclaimColor);

    app.publish('screen.recounted', 0);
  });

  app.socket.on('screen.joined', function(joinedSockets)
  {
    var oldCount = app.screen.userCount;

    _.each(joinedSockets, function(joinedSocket)
    {
      if (joinedSocket.id === app.socket.id)
      {
        return;
      }

      var user = {
        id: joinedSocket.id,
        name: joinedSocket.name,
        color: app.USER_COLORS.shift() || app.SPARE_USER_COLOR
      };

      ++app.screen.userCount;

      app.screen.users[user.id] = user;

      app.publish('screen.joined', user, app.screen.userCount);
    });

    if (app.screen.userCount !== oldCount)
    {
      app.publish('screen.recounted', app.screen.userCount);
    }
  });

  app.socket.on('screen.left', function(sid)
  {
    if (!app.screen.users.hasOwnProperty(sid))
    {
      return;
    }

    var leaver = app.screen.users[sid];

    delete app.screen.users[sid];

    reclaimColor(leaver);

    --app.screen.userCount;

    app.publish('screen.left', leaver);
    app.publish('screen.recounted', app.screen.userCount);
  });

})(window.app);
