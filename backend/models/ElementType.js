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

exports.getAll = function(done)
{
  done(null, elementTypes);
};
