var util = require('util');

module.exports = FancyError;

function FancyError(message)
{
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);

  this.name = 'Error';
  this.message = util.format.apply(util, arguments);
}

util.inherits(FancyError, Error);
