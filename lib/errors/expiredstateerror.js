/**
 * `ExpiredStateError` error.
 */
function ExpiredStateError(message, state) {
  Error.call(this);
  this.message = message;
  this.state = state;
}

/**
 * Inherit from `Error`.
 */
ExpiredStateError.prototype.__proto__ = Error.prototype;


/**
 * Expose `ExpiredStateError`.
 */
module.exports = ExpiredStateError;
