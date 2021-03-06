var util = require('util');

module.exports = NotFoundError;

function NotFoundError(message)
{
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);

  this.name = 'NotFoundError';
  this.code = 404;
  this.message = util.format.apply(util, arguments);
}

util.inherits(NotFoundError, Error);
