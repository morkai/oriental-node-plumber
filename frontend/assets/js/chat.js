(function(app)
{
  var chat = app.chat = {};

  /**
   * @param {Boolean=} state
   */
  chat.toggle = function(state)
  {
    if (_.isUndefined(state))
    {
      chat.$editor.toggleClass('editor-with-chat');
    }
    else if (state)
    {
      chat.$editor.addClass('editor-with-chat');
    }
    else
    {
      chat.$editor.removeClass('editor-with-chat');
    }

    if (chat.$editor.hasClass('editor-with-chat'))
    {
      chat.$chatText.focus();
    }
    else
    {
      chat.$editors.focus();
    }
  };

  /**
   * @type {String}
   */
  chat.lastMessageUserId = '';

  /**
   * @param {String} text
   * @param {String=} userId
   */
  chat.addMessage = function(text, userId)
  {
    var message = {
      text: text,
      followup: chat.lastMessageUserId === userId
    };

    chat.lastMessageUserId = userId;

    var user = app.screen.users[userId];

    if (typeof user === 'undefined')
    {
      if (userId === app.socket.id)
      {
        message.user = 'Me';
        message.color = app.USER_COLOR;
      }
      else
      {
        message.user = 'Guest';
        message.color = app.SPARE_USER_COLOR;
      }
    }
    else
    {
      message.user = user.name;
      message.color = user.color;
    }

    var scrollToBottom =
      chat.$chatMessages.height() + chat.$chatMessages[0].scrollTop
        >= chat.$chatMessages[0].scrollHeight;

    app.renderTemplate('editor-chat-message', message).appendTo(chat.$chatMessages);

    if (scrollToBottom)
    {
      chat.$chatMessages.scrollTop(chat.$chatMessages[0].scrollHeight);
    }
  };

  /**
   * @param {String} text
   */
  chat.sendMessage = function(text)
  {
    text = text.trim();

    if (text.length > 0)
    {
      app.socket.emit('chat.message', {
        text: text
      });

      chat.addMessage(text, app.socket.id);
    }

    chat.$chatText.val('');
  };

  app.subscribe('screen.recounted', function(newCount)
  {
    if (newCount === 0)
    {
      chat.$editorsCount.text('No');
      chat.$editorsBadges.empty();
    }
    else
    {
      chat.$editorsCount.text(newCount);
    }
  });

  app.subscribe('screen.joined', function(user)
  {
    app.renderTemplate('editor-editors-badge', user).appendTo(chat.$editorsBadges);
    app.renderTemplate('editor-chat-user', user).appendTo(chat.$chatUsers);
  });

  app.subscribe('screen.left', function(user)
  {
    chat.$editorsBadges.find('[data-id="' + user.id + '"]').remove();
    chat.$chatUsers.find('[data-id="' + user.id + '"]').remove();
  });

  app.socket.on('chat.messaged', function(userId, text)
  {
    chat.addMessage(text, userId);
  });

  $(function()
  {
    chat.$editor = $('.editor');
    chat.$editors = $('.editor-editors');
    chat.$editorsCount = chat.$editors.find('.editor-editors-count');
    chat.$editorsBadges = chat.$editors.find('.editor-editors-badges');
    chat.$chat = $('.editor-chat');
    chat.$chatUsers = chat.$chat.find('.editor-chat-users');
    chat.$chatMessages = chat.$chat.find('.editor-chat-messages');
    chat.$chatText = chat.$chat.find('.editor-chat-text');

    $(document.body).on('keypress', function(e)
    {
      if (e.which === 32 &&
        (e.target === document.body || e.target === chat.$editors[0]))
      {
        chat.toggle(true);

        return false;
      }

      return true;
    });

    chat.$chatText.on('keydown', function(e)
    {
      if (e.which === 27)
      {
        chat.toggle(false);

        return false;
      }
      if (e.which === 13)
      {
        chat.sendMessage(this.value);

        return false;
      }

      return true;
    });

    chat.$editors.click(function()
    {
      chat.toggle();

      return false;
    });
  });
})(window.app);
