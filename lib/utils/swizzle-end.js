/**
 * Create a replacement end method.
 *
 * @param {function} prevEnd
 * @param {function} fn
 * @private
 */
function createEnd(prevEnd, fn) {
  // return function with core name and argument list
  return function end(chunk, encoding) {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    
    fn.call(this, function(err) {
      // TODO: error handling
      prevEnd.apply(self, args);
    });
  }
}

/**
 * Execute a function when a response is about to end.
 *
 * @param {object} res
 * @return {function} fn
 * @public
 */
function swizzleEnd(res, fn) {
  res.end = createEnd(res.end, fn);
}


/**
 * Module exports.
 *
 * NOTE: This module is heavily inspired by `on-headers`.
 *       https://github.com/jshttp/on-headers
 *
 *       This module is also inspired by `on-finished`.
 *       https://github.com/jshttp/on-finished
 *
 *       The primary distinction between this module and `on-finished`, is that
 *       `on-finished` registers an event listener, whereas this module proxies
 *       the function.  The reason for this is that state needs to be commited
 *       prior to the resonse ending, because the state handle needs to be
 *       included in the response itself.  As such, the function is proxied, so
 *       that it executes prior to the response being finished.
 *
 * @public
 */
exports = module.exports = swizzleEnd;
