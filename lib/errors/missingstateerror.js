/**
 * `MissingStateError` error.
 */
function MissingStateError(message, handle) {
  Error.call(this);
  this.message = message;
  this.handle = handle;
}

/**
 * Inherit from `Error`.
 */
MissingStateError.prototype.__proto__ = Error.prototype;


/**
 * Expose `MissingStateError`.
 */
module.exports = MissingStateError;
