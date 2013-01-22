var _ = require('lodash');
var FancyError = require('../util/FancyError');

var elementTypes = [
  {
    "id": "rect",
    "name": "Rectangle",
    "endpoints": [
      {
        "id": "top",
        "anchor": [0.5, 0, 0, -1, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      },
      {
        "id": "right",
        "anchor": [1, 0.5, 1, 0, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      },
      {
        "id": "bottom",
        "anchor": [0.5, 1, 0, 1, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      },
      {
        "id": "left",
        "anchor": [0, 0.5, -1, 0, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      }
    ]
  },
  {
    "id": "circle",
    "name": "Circle",
    "endpoints": [
      {
        "id": "top",
        "anchor": [0.5, 0, 0, -1, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      },
      {
        "id": "right",
        "anchor": [1, 0.5, 1, 0, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      },
      {
        "id": "bottom",
        "anchor": [0.5, 1, 0, 1, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      },
      {
        "id": "left",
        "anchor": [0, 0.5, -1, 0, 0, 0],
        "source": true,
        "target": true,
        "maxConnections": 1
      }
    ]
  }
];

/**
 * @param {function(Error?, Array.<Object>?)} done
 */
exports.getAll = function(done)
{
  done(null, elementTypes);
};

/**
 * @param {String} id
 * @param {function(Error?, Object?)} done
 */
exports.getOne = function(id, done)
{
  var elementType = null;

  for (var i = 0, l = elementTypes.length; i < l; ++i)
  {
    if (elementTypes[i].id === id)
    {
      elementType = elementTypes[i];

      break;
    }
  }

  done(null, elementType);
};

/**
 * @param {Object|String} elementTypeOrId
 * @param {String} endpointId
 * @param {function(Error?, Object?)} done
 */
exports.getEndpoint = function(elementTypeOrId, endpointId, done)
{
  if (!_.isObject(elementTypeOrId))
  {
    return exports.getOne(elementTypeOrId, function(err, elementType)
    {
      if (err)
      {
        return done(err);
      }

      if (!elementType)
      {
        return done(new FancyError(
          "Element type does not exist: [%s]", elementTypeOrId
        ));
      }

      return exports.getEndpoint(elementType, endpointId, done);
    });
  }

  var endpoints = elementTypeOrId.endpoints;

  if (!Array.isArray(endpoints))
  {
    return done(new Error(
      "Invalid element type specified. Expected an object with an array of endpoints."
    ));
  }

  for (var i = 0, l = endpoints.length; i < l; ++i)
  {
    if (endpoints[i].id === endpointId)
    {
      return done(null, endpoints[i]);
    }
  }

  return done(new FancyError(
    "Invalid endpoint for element type [%s]: [%s]",
    elementTypeOrId.id,
    endpointId
  ));
};
