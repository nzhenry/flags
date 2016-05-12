'use strict';

module.exports = function PasswordResetKeyMismatchError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message ? message : 'key mismatch';
};

require('util').inherits(module.exports, Error);
