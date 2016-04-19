var SessionStore = require('../stores/session');


module.exports = function(options) {
  options = options || {};
  
  var store = options.store || new SessionStore();
  
  
  return function resumeState(req, res, next) {
    // TODO: This should attempt to load if not already present, so
    //       to have a continuation.resume() style API
    // if (req.state) { remove and load prev } else { load state }
    
    if (!req.state) {
      // No state, nothing to resume.  `next` middleware is expected to
      // implement default behavior for responding to the request.
      return next();
    }
    
    var state = req.state;
    delete req.state;
    
    // Remove the current state from any persistent storage, due to the
    // fact that it is complete and no longer needed when resuming any
    // previous state.
    store.destroy(req, state.handle, function(err) {
      if (err) { return next(err); }
      if (!state.prev) {
        // No previous state, nothing to resume.  `next` middleware is
        // expected to implement default behavior for responding to the
        // request.
        return next();
      }
      
      store.load(req, state.prev, function(err, state) {
        if (err) { return next(err); }
        
        req.state = state;
        // TODO: Implement a middleware with "state handlers"
        next();
      })
    });
  };
};
