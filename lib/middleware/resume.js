var SessionStore = require('../stores/session');


module.exports = function(flows, store, options) {
  options = options || {};
  
  
  return function resumeState(req, res, next) {
    // TODO: This should attempt to load if not already present, so
    //       to have a continuation.resume() style API
    // if (req.state) { remove and load prev } else { load state }
    
    if (!req.state) {
      // No current state, nothing to resume.  `next` middleware is expected to
      // implement default behavior for responding to the request.
      return next();
    }
    
    var state = req.state;
    delete req.state;
    
    // Remove the current state from any persistent storage, due to the
    // fact that it is complete.
    store.destroy(req, state.handle, function(err) {
      if (err) { return next(err); }
      if (!state.prev) {
        // No previous state, nothing to resume.  `next` middleware is
        // expected to implement default behavior for responding to the
        // request.
        return next();
      }
      
      var yieldState = state;
      store.load(req, state.prev, function(err, state) {
        if (err) { return next(err); }
        if (!state) { return next(new Error("Cannot resume unnamed flow (state not found)")); }
        
        req.state = state;
        // Expose the state that is yeilding control back to the previous state.
        // When the previous state is resumed, it can use this context to inform
        // its behavior.
        req.yieldState = yieldState;
        
        var name = req.state.name;
        if (!name) { return next(new Error("Cannot resume unnamed flow")); }
        
        try {
          flows.resume(name, req, res, next);
        } catch(ex) {
          return next(ex);
        }
      })
    });
  };
};
