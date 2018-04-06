/**
 * Create a replacement render method.
 *
 * @param {function} prevRender
 * @param {function} fn
 * @private
 */
function createRender(prevRender, fn) {
  // return function with core name and argument list
  return function render(view, options, callback) {
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    fn.call(this, function(err) {
      // TODO: error handling
      prevRender.apply(self, args);
    });
  }
}

/**
 * Execute a function when a response is about to render.
 *
 * @param {object} res
 * @return {function} fn
 * @public
 */
function swizzleRender(res, fn) {
  res.render = createRender(res.render, fn);
}


/**
 * Module exports.
 *
 * NOTE: This module is heavily inspired by `on-headers`.
 *       https://github.com/jshttp/on-headers
 *
 * @public
 */
exports = module.exports = swizzleRender;
