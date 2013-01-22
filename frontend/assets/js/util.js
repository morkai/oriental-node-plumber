(function(app)
{
  var util = app.util = {};

  util.noop = function() {};

  /**
   * @param {XMLHttpRequest} xhr
   * @return {Error}
   */
  util.xhrError = function(xhr)
  {
    try
    {
      return JSON.parse(xhr.responseText).error;
    }
    catch (x)
    {
      return new Error(xhr.responseText);
    }
  };
})(window.app);
