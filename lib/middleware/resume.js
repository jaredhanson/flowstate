var SessionStore = require('../stores/session');


module.exports = function(flows, store, options) {
  options = options || {};
  
  
  return function resumeState(req, res, next) {
    // TODO: This should attempt to load if not already present, so
    //       to have a continuation.resume() style API
    // if (req.state) { remove and load prev } else { load state }
    
    console.log('!! ATTEMPTING TO RESUME STATE');
    console.log(req.state);
    console.log('-')
    console.log(req.session);
    
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
      
      store.load(req, state.prev, function(err, state) {
        if (err) { return next(err); }
        
        console.log('!! CONTINUING TO PREV STATE');
        console.log(state);
        console.log('--')
        
        req.state = state;
        
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
