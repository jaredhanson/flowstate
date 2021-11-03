var State = require('../state')
  , utils = require('../utils');


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
  
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  return function loadState(req, res, next) {
    var h = getHandle(req);
    if (!h) {
      return next();
    }
    
    
    function loaded(err, state) {
      if (err) {
        if (err.state) {
          req.state = err.state;
        }
        return next(err);
      }
  
      if (!state) {
        return next();
      }
  
  
      state = new State(req, state, h);
  
      if (state.location && state.location !== utils.originalURLWithoutQuery(req)) {
        req.state = new State(req, { state: h });
      } else if (1) { // !name
        // TODO: Remove this
        req.state = state;
      } else {
        // The loaded state is not the expected state.  Save what was loaded,
        // as an optimization to avoid re-loading later if the state is resumed.
        req._state = state;
      }
      next();
    }
    
    if (options.get) {
      options.get(req, h, loaded);
      
      return;
    }
    
    store.load(req, h, loaded);
  };
};
