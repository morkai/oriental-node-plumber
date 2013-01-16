var _ = require('lodash');

var ridRegExp = /^#[0-9]+:[0-9]+$/;

/**
 * @param {Object} document
 * @param {Boolean=true} inArray
 * @return {Object}
 */
exports.toJSON = function(document, inArray)
{
  if (typeof inArray === 'undefined')
  {
    inArray = true;
  }

  if (typeof document.rid === 'string')
  {
    document.id = document.rid;
    document.rid = undefined;
  }
  else
  {
    document.id = document['@rid'];
  }

  for (var property in document)
  {
    if (!document.hasOwnProperty(property))
    {
      continue;
    }

    if (property[0] === '@')
    {
      document[property] = undefined;

      continue;
    }

    document[property] = convertValueToJSON(document[property], inArray);
  }

  return document;
};

/**
 * @private
 * @param {*} value
 * @param {Boolean} inArray
 * @return {*}
 */
function convertValueToJSON(value, inArray)
{
  var type = typeof value;

  if (type === 'string' && ridRegExp.test(value))
  {
    return value.substr(1);
  }

  if (value !== null && type === 'object')
  {
    return exports.toJSON(value, inArray);
  }

  if (inArray && Array.isArray(value))
  {
    for (var i = 0, l = value.length; i < l; ++i)
    {
      value[i] = convertValueToJSON(value[i]);
    }
  }

  return value;
}
