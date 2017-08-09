var SessionStore      = require('../stores/session');
var ExpiredStateError = require('../errors/expiredstateerror');


module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { from: options };
  }
  options = options || {};
  
  var from = options.from;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function completeStateError(err, req, res, next) {
    if (req._skipResumeError) { return next(err); }
    
    function dispatch(name) {
      if (!name) { return next(new Error("Cannot resume unnamed flow")); }
      
      function cont(err) {
        dispatcher._resume(name, err, req, res, next);
      }
      
      var yname = from || (req.yieldState && req.yieldState.name);
      if (yname) {
        // TODO: Make sure transition errors get plumbed through correctly
        dispatcher._transition(name, yname, err, req, res, cont);
      } else {
        cont(err);
      }
    }
    
    function proceed(h, ystate) {
      if (!h) {
        // No state to resume.  `next` middleware is expected to implement
        // default behavior for responding to the request.
        return next(err);
      }
      
      store.load(req, h, function(ierr, state) {
        if (ierr) { return next(err); }
        if (!state) { return next(err); }
        
        req.state = state;
        
        if (from && from === state.name) {
          // State has been loaded for the state that is the yeilding state, and
          // therefore needs finalizing and further resumption, if possible.
          return finalize(state);
        }
        
        // Expose the state that is yeilding control back to the parent state.
        // When the parent state is resumed, it can use this context to inform
        // its behavior.
        req.yieldState = ystate;
        
        dispatch(state.name);
      });
    }
    
    function finalize(state) {
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.  Proceed to load the parent state (if any)
      // and resume processing.
      store.destroy(req, state.handle, function(ierr) {
        if (ierr) { return next(err); }
        
        // Don't try and load the parent state if it's antecedent removal was the cause
        // of the error that led to this processing in the first place.
        if (err instanceof ExpiredStateError && err.state.handle === state.up) { return next(err); };
        
        return proceed(state.up, state);
      });
    }
    
    
    // TODO: Deliberately unset the error flag
    
    if (req.state) {
      if (from && from !== req.state.name) {
        // State has been loaded for a state that is not the yeilding state, and
        // therefore is the state that is being resumed.
        return dispatch(req.state.name);
      }
      
      finalize(req.state);
    } else if (req._state) {
      // State has been loaded for a state that was not the expected (and
      // yielding) state, and therefore is the state that is being resumed.
      // This is an optimization, supported by a prior call to `loadState`
      // with a specified name option.
      req.state = req._state;
      delete req._state;
      return dispatch(req.state.name);
    } else {
      return proceed(getHandle(req));
    }
  };
};
