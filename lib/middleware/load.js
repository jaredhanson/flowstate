/**
 * Module dependencies.
 */
var SessionStore = require('../stores/session');


/**
 * Load state.
 *
 * This middleware is used to load state associated with a request.  The state
 * will be made available at `req.state`.
 *
 * HTTP is a stateless protocol.  In order to support stateful interactions, the
 * client and server need to operate in coordination.  The server is responsible
 * for persisting state associated with a request.  The client is responsible for
 * indicating that state in subsequent requests to the server (via a `state`
 * parameter in the query or body, by default).  The server then loads the
 * previously persisted state in order to continue processing the transaction.
 *
 * Options:
 *
 *     name   set req.state only if the state name is equal to the option value
 *
 * @return {Function}
 * @api public
 */
module.exports = function(store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  // TODO: Add a `required` option to require a state of specific name?
  
  var name = options.name;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  return function loadState(req, res, next) {
    var h = getHandle(req);
    if (!h) { return next(); }
    
    store.load(req, h, function (err, state) {
      if (err) { return next(err); }
      if (!name) {
        req.state = state;
      } else if (name == state.name) {
        req.state = state;
      } else {
        // The loaded state is not the expected state.  Save what was loaded,
        // as an optimization to avoid re-loading later if the state is resumed.
        req._state = state;
      }
      next();
    });
  };
};
