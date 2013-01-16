(function(app)
{
  var SELECTED_ELEMENT_CLASS = 'element-selected';

  app.editor.selectAllElements = function()
  {
    var deselectedElements = app.editor.$canvas
      .find('.element:not(.' + SELECTED_ELEMENT_CLASS + ')')
      .addClass(SELECTED_ELEMENT_CLASS)
      .get();

    if (deselectedElements.length === 0)
    {
      return;
    }

    app.selectedElements.push.apply(app.selectedElements, deselectedElements);

    app.publish('editor.selection.selected', deselectedElements);
  };

  app.editor.deselectAllElements = function()
  {
    if (app.selectedElements.length === 0)
    {
      return;
    }

    var deselectedElements = app.selectedElements;

    $(deselectedElements).removeClass(SELECTED_ELEMENT_CLASS);

    app.selectedElements = [];

    app.publish('editor.selection.deselected', deselectedElements);
  };

  /**
   * @param {HTMLElement} el
   * @param {Boolean=} overwrite
   */
  app.editor.selectElement = function(el, overwrite)
  {
    var isSelected = $(el).hasClass(SELECTED_ELEMENT_CLASS);

    if (isSelected)
    {
      if (overwrite)
      {
        var deselectedElements =
          $(app.selectedElements).not(el).removeClass(SELECTED_ELEMENT_CLASS);

        app.selectedElements = [el];

        if (deselectedElements.length > 0)
        {
          app.publish('editor.selection.deselected', deselectedElements);
        }
      }
    }
    else
    {
      if (overwrite)
      {
        app.editor.deselectAllElements();
        app.editor.selectElement(el);
      }
      else
      {
        $(el).addClass(SELECTED_ELEMENT_CLASS);

        app.selectedElements.push(el);

        app.publish('editor.selection.selected', [el]);
      }
    }
  };

  app.editor.deselectElement = function(el)
  {
    var pos = app.selectedElements.indexOf(el);

    if (pos === -1)
    {
      return;
    }

    $(el).removeClass(SELECTED_ELEMENT_CLASS);

    app.selectedElements.splice(pos, 1);

    app.publish('editor.selection.deselected', [el]);
  };

  $(function()
  {
    var $canvas = app.editor.$canvas;

    $(document.body).on('keydown', function(e)
    {
      if (!e.ctrlKey || e.keyCode !== 65 || e.target !== document.body)
      {
        return true;
      }

      app.editor.selectAllElements();

      return false;
    });

    $canvas.on('click', '.element', function(e)
    {
      var el = this;
      var $el = $(el);

      if ($el.hasClass(SELECTED_ELEMENT_CLASS))
      {
        if (e.ctrlKey)
        {
          app.editor.deselectElement(el);
        }
        else
        {
          app.editor.selectElement(el, true);
        }
      }
      else
      {
        app.editor.selectElement(el, e.ctrlKey !== true);
      }

      return false;
    });

    $canvas.on('click', function()
    {
      app.editor.deselectAllElements();
    });

    $canvas.xselectable({
      filter: '.element',
      cancel: '.element, .element-endpoint, .element-connection',
      selectedCssClass: SELECTED_ELEMENT_CLASS,
      boxCssClass: 'editor-selection-box'
    });

    $canvas.on('xselectableselected', function(e, ui)
    {
      app.selectedElements.push.apply(app.selectedElements, ui.selected);

      app.publish('editor.selection.selected', ui.selected);
    });

    $canvas.on('xselectableunselected', function(e, ui)
    {
      app.selectedElements = _.difference(app.selectedElements,  ui.unselected);

      app.publish('editor.selection.deselected', ui.unselected);
    });
  });

})(window.app);
