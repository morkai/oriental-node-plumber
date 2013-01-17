(function(app)
{
  var editor = app.editor = {};

  /**
   * @type {Array.<Number>}
   */
  editor.gridSize = [10, 10];

  /**
   * @type {String}
   */
  editor.connectorType = 'bezier';

  /**
   * @param {String} connectorType
   */
  editor.setConnectorType = function(connectorType)
  {
    if (editor.$connector)
    {
      editor.$connector
        .val(connectorType)
        .html('<i class="icon-curve-' + connectorType + '"></i>');
    }

    if (connectorType === editor.connectorType)
    {
      return;
    }

    var connector;

    switch (connectorType)
    {
      case 'straight':
        connector = 'Straight';
        break;

      case 'flowchart':
        connector = ['Flowchart', {stub: 30}];
        break;

      case 'state-machine':
        connector = 'StateMachine';
        break;

      default:
        connector = 'Bezier';
        break;
    }

    jsPlumb.Defaults.Connector = connector;

    app.publish('editor.connectorType.changed', connectorType);
  };

  /**
   * @return {Boolean}
   */
  editor.isSnapToGridEnabled = function()
  {
    return editor.$snap.hasClass('active');
  };

  editor.toggleSnapToGrid = function()
  {
    editor.$snap.click();
  };

  editor.isGridEnabled = function()
  {
    return editor.$grid.hasClass('active');
  };

  editor.toggleGrid = function()
  {
    editor.$grid.click();
  };

  /**
   * @param {Array.<Number>} gridSize
   */
  editor.setGridSize = function(gridSize)
  {
    if (editor.gridSize[0] !== gridSize[0]
      || editor.gridSize[1] !== gridSize[1])
    {
      editor.gridSize = gridSize;

      app.publish('editor.grid.sizeChanged', gridSize);
    }
  };

  /**
   * @private
   */
  function updateGrid()
  {
    var img = 'none';

    if (editor.isGridEnabled())
    {
      img = 'url(/grid.svg?w='
        + editor.gridSize[0]
        + '&h='
        + editor.gridSize[1]
        + ')';
    }

    editor.$canvas.css('background-image', img);
  }

  app.subscribe('editor.grid.toggled', updateGrid);
  app.subscribe('editor.grid.sizeChanged', updateGrid);

  $(function()
  {
    editor.$editor = $('.editor');
    editor.$toolbar = editor.$editor.find('.editor-toolbar');
    editor.$connector = editor.$toolbar.find('.editor-toolbar-connector');
    editor.$snap = editor.$toolbar.find('.editor-toolbar-snap');
    editor.$grid = editor.$toolbar.find('.editor-toolbar-grid');
    editor.$gridValues = editor.$toolbar.find('.editor-toolbar-grid-values');
    editor.$canvas = editor.$editor.find('.editor-canvas');

    editor.$toolbar.find('[data-tooltip]').tooltip({
      container: document.body,
      placement: 'top'
    });

    editor.$toolbar
      .find('.editor-toolbar-connector-values')
      .on('click', 'a', function(e)
      {
        var connectorType = $(this).attr('data-value');

        editor.setConnectorType(connectorType);

        e.preventDefault();
      });

    editor.$connector.click(function()
    {
      if (editor.$connector.hasClass('disabled'))
      {
        return;
      }

      var newConnectorType = this.value;

      // TODO Change a type of the selected connection
      console.log(
        'Change a type of the selected connection to: %s',
        newConnectorType
      );
    });

    editor.$snap.click(function()
    {
      _.defer(function()
      {
        app.publish('editor.snapToGrid.toggled', editor.$snap.hasClass('active'));
      });
    });

    editor.$grid.click(function()
    {
      _.defer(function()
      {
        app.publish('editor.grid.toggled', editor.$grid.hasClass('active'));
      });
    });

    editor.$gridValues.on('click', 'a', function(e)
    {
      e.preventDefault();

      var newGrid = $(this).attr('data-value').split('x').map(Number);

      if (newGrid[0] === 0 && newGrid[1] === 0)
      {
        // TODO Show custom grid size dialog
        console.log('TODO: Show custom grid size dialog');
      }
      else
      {
        editor.setGridSize(newGrid);
      }
    });

    editor.toggleGrid();
    editor.toggleSnapToGrid();
  });

})(window.app);