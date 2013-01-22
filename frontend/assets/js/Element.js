(function(app)
{
  var DRAGGABLE_OPTIONS = {
    cursor: 'move',
    stack: '.element',
    scrollSensitivity: 100,
    grid: [1, 1],
    start: function(e, ui)
    {
      app.publish('element.dragStarted', e, ui);
    },
    drag: function(e, ui)
    {
      app.publish('element.dragged', e, ui);
    },
    stop: function(e, ui)
    {
      app.publish('element.dragStopped', e, ui);
    }
  };

  app.Element = Element;

  /**
   * @constructor
   * @param {Object} data
   */
  function Element(data)
  {
    /**
     * @type {String}
     */
    this.id = data.id;

    /**
     * @type {String}
     */
    this.name = data.name;

    /**
     * @type {app.ElementType}
     */
    this.type = data.type;

    /**
     * @type {Number}
     */
    this.left = data.left;

    /**
     * @type {Number}
     */
    this.top = data.top;

    /**
     * @type {Array.<app.Connection>}
     */
    this.out = data.out;

    /**
     * @type {Array.<app.Connection>}
     */
    this.in = data.in;

    /**
     * @type {Object.<String, jsPlumb.Endpoint>}
     */
    this.endpoints = {};

    /**
     * @type {jQuery|null}
     */
    this.$ = null;
  }

  /**
   * @param {jQuery} $parent
   */
  Element.prototype.render = function($parent)
  {
    this.$ = this.type.renderElement(this);

    this.$.attr({
      'data-id': this.id,
      'data-top': this.top,
      'data-left': this.left
    });

    this.$.css({
      top: this.top + 'px',
      left: this.left + 'px'
    });

    jsPlumb.draggable(this.$, DRAGGABLE_OPTIONS);

    this.$.appendTo($parent);

    this.type.addEndpoints(this);
  };

  Element.prototype.renderConnections = function()
  {
    for (var i = 0, l = this.out.length; i < l; ++i)
    {
      this.out[i].createJsPlumbConnection();
    }
  };

  /**
   * @param {Number} left
   * @param {Number} top
   */
  Element.prototype.setPositionData = function(left, top)
  {
    this.$.attr({
      'data-left': left,
      'data-top': top
    });
  };

  /**
   * @private
   * @param {Array.<Number>} gridSize
   */
  function setElementsGridSize(gridSize)
  {
    DRAGGABLE_OPTIONS.grid = gridSize;

    $('.element').draggable('option', 'grid', gridSize);
  }

  app.subscribe('editor.snapToGrid.toggled', function(state)
  {
    setElementsGridSize(state ? app.editor.gridSize : [1, 1]);
  });

  app.subscribe('editor.grid.sizeChanged', function(gridSize)
  {
    if (app.editor.isSnapToGridEnabled())
    {
      setElementsGridSize(gridSize);
    }
  });

})(window.app);
