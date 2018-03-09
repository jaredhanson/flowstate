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
 *     required   require state, failing otherwise (default: false)
 *
 * Examples:
 *
 *     app.get('/login',
 *       flowstate.loadState(),
 *       function(req, res, next) {
 *         res.locals.failureCount = req.state.failureCount;
 *         res.render('login');
 *       });
 *
 *     app.get('/login/callback',
 *       flowstate.loadState({ name: 'oauth2-redirect', required: true }),
 *       function(req, res, next) {
 *         // ...
 *       });
 *
 * @return {Function}
 * @api public
 */
module.exports = function(store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  var name = options.name;
  var required = options.required !== undefined ? options.required : false;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  return function loadState(req, res, next) {
    var h = getHandle(req);
    if (!h) {
      if (required) {
        // TODO: Should this be a client error?
        return next(new Error("Failed to load required state" + (name ? " '" + name + "'" : "")));
      }
      return next();
    }
    
    store.load(req, h, function (err, state) {
      //err = new Error('wtf')
      //err.state = state
      
      if (err) {
        if (err.state) {
          if (!name) {
            req.state = err.state;
          } else if (err.state.name == name) {
            req.state = err.state;
          }
        }
        return next(err);
      }
      if (!name) {
        req.state = state;
      } else if (state && state.name == name) {
        req.state = state;
      } else {
        // The loaded state is not the expected state.  Save what was loaded,
        // as an optimization to avoid re-loading later if the state is resumed.
        req._state = state;
      }
      
      if (required && !req.state) {
        return next(new Error("Failed to load required state" + (name ? " '" + name + "'" : "")));
      }
      next();
    });
  };
};
