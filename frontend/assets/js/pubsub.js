(function(app)
{
  var subscriptions = {};

  /**
   * @param {String} topic
   * @param {*=} context
   * @param {function(*)} cb
   */
  app.subscribe = function(topic, context, cb)
  {
    if (arguments.length === 2)
    {
      cb = context;
      context = undefined;
    }

    if (typeof subscriptions[topic] === 'undefined')
    {
      subscriptions[topic] = [];
    }

    subscriptions[topic].push(cb, context);
  };

  /**
   * @param {String=} topic
   * @param {*=} context
   * @param {function(*)=} cb
   */
  app.unsubscribe = function(topic, context, cb)
  {
    if (arguments.length === 0)
    {
      subscriptions = {};

      return;
    }

    if (arguments.length === 1)
    {
      delete subscriptions[topic];

      return;
    }

    var topicSubscriptions = subscriptions[topic];

    if (typeof topicSubscriptions === 'undefined')
    {
      return;
    }

    if (arguments.length === 2)
    {
      cb = context;
      context = null;
    }

    var pos = -1;

    for (var i = 0, l = topicSubscriptions.length; i < l; i += 2)
    {
      if (topicSubscriptions[i] === cb && topicSubscriptions[i + 1] === context)
      {
        pos = i;

        break;
      }
    }

    if (pos !== -1)
    {
      topicSubscriptions.splice(pos, 2);
    }
  };

  /**
   * @param {String} topic
   * @param {Object=} data...
   */
  app.publish = function(topic, data)
  {
    var topicSubscriptions = subscriptions[topic];

    if (typeof topicSubscriptions === 'undefined')
    {
      return;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0, l = topicSubscriptions.length; i < l; ++i)
    {
      topicSubscriptions[i++].apply(topicSubscriptions[i], args);
    }
  };

})(window.app);
