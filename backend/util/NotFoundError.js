var inherits = require('util').inherits;

module.exports = NotFoundError;

function NotFoundError(message)
{
  Error.call(this, message);
  Error.captureStackTrace(this, arguments.callee);

  this.name = 'NotFoundError';
  this.code = 404;
}

inherits(NotFoundError, Error);
