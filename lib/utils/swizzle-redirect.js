/**
 * Create a replacement redirect method.
 *
 * @param {function} prevRedirect
 * @param {function} fn
 * @private
 */
function createRedirect(prevRedirect, fn) {
  // return function with core name and argument list
  return function redirect() {
    var args = Array.apply(null, arguments);

    if (args.length === 2 && typeof args[0] === 'number') {
      url = args[1];
    } else {
      url = args[0];
    }

    var self = this;

    fn.call(this, url, function(err, url) {
      // TODO: error handling
      if (url) {
        if (args.length === 2 && typeof args[0] === 'number') {
          // allow status / url
          args[1] = url;
        } else {
          args[0] = url;
        }
      }

      prevRedirect.apply(self, args);
    });
  }
}

/**
 * Execute a function when a response is about to redirect.
 *
 * @param {object} res
 * @return {function} fn
 * @public
 */
function swizzleRedirect(res, fn) {
  res.redirect = createRedirect(res.redirect, fn);
}


/**
 * Module exports.
 *
 * NOTE: This module is heavily inspired by `on-headers`.
 *       https://github.com/jshttp/on-headers
 *
 * @public
 */
exports = module.exports = swizzleRedirect;
