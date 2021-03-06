(function(app)
{
  function deleteElements(elementIds)
  {
    elementIds.forEach(app.deleteElement);
  }

  app.socket.on('element.created', function addRemoteElement(data)
  {
    app.addElement(data).render(app.editor.$canvas);
  });

  app.socket.on('element.deleted', deleteElements);

  $(function()
  {
    $(document).on('keyup', function deleteSelectedElements(e)
    {
      if (e.which !== 46
        || app.selectedElements.length === 0)
      {
        return;
      }

      var elementIds = app.selectedElements.map(function(selectedElement)
      {
        return $(selectedElement).attr('data-id');
      });

      var req = $.ajax({
        type: 'delete',
        url: '/elements',
        data: JSON.stringify(elementIds)
      });

      req.fail(function(xhr)
      {
        var err = app.util.xhrError(xhr);

        console.error("Failed to delete selected elements: %s", err.message);
      });

      req.done(deleteElements);

      return false;
    });
  });
})(window.app);
