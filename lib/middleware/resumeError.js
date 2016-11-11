var SessionStore      = require('../stores/session');
var ExpiredStateError = require('../errors/expiredstateerror');
var MissingStateError = require('../errors/missingstateerror');

module.exports = function(flows, store, options) {
  options = options || {};
  
  
  return function resumeStateError(err, req, res, next) {
    console.log('## resumeStateError');
    console.log(err);
    console.log(err.stack)
    console.log(options)
    console.log(req.state);
    console.log(req._state);
    console.log('--')
    
    // TODO: This should attempt to load if not already present, so
    //       to have a continuation.resume() style API
    // if (req.state) { remove and load prev } else { load state }
    
    if (!req.state) {
      // No current state, nothing to resume.  `next` middleware is expected to
      // implement default behavior for handling the error.
      return next(err);
    }
    
    var state = req.state;
    delete req.state;
    
    // Remove the current state from any persistent storage, due to the
    // fact that it is complete.
    store.destroy(req, state.handle, function(ierr) {
      if (ierr) { return next(ierr); }
      if (!state.prev) {
        // No previous state, nothing to resume.  `next` middleware is
        // expected to implement default behavior for handling the error.
        return next(err);
      }

      // Don't try and load the previous state if it's antecedent removal was the cause
      // of the error that led to this processing in the first place.
      if (err instanceof ExpiredStateError && err.state.handle === state.prev) { return next(err); };

      var yieldState = state;
      store.load(req, state.prev, function(ierr, state) {
        if (ierr) { return next(ierr); }
        if (!state) { return next(new MissingStateError("Cannot resume unnamed flow (state not found)", yieldState.prev)); }
        
        req.state = state;
        // Expose the state that is yeilding control back to the previous state.
        // When the previous state is resumed, it can use this context to inform
        // its behavior.
        req.yieldState = yieldState;
        
        var name = req.state.name;
        if (!name) { return next(new Error("Cannot resume unnamed flow")); }
        
        try {
          flows._resume(name, err, req, res, next);
        } catch(ex) {
          return next(ex);
        }
      })
    });
  };
};
