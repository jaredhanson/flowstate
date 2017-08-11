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
      
      function cont(err) {
        if (!name) { return next(new Error("Cannot resume unnamed flow")); }
        
        dispatcher._resume(name, err, req, res, next);
      }
      
      // If we have a name, then there is a previous state to transition through
      // and then resume. If we do not have a name then there is no previous state
      // and we should look for a default transition that will then pass off to the
      // `next` middleware, which will be expected to provide default error behavior.
      var yname, post;
      if (name) {
        yname = from || (req.yieldState && req.yieldState.name);
        post  = cont;
      } else {
        yname = from || (req.state && req.state.name);
        post  = next;
      }
      
      if (yname) {
        // TODO: Make sure transition errors get plumbed through correctly
        dispatcher._transition(name, yname, err, req, res, post);
      } else {
        post(err);
      }
    }
    
    function proceed(h, ystate) {
      if (!h) {
        return dispatch();
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
        
        // Expose the state that is yeilding control back to the previous state.
        // When the previous state is resumed, it can use this context to inform
        // its behavior.
        req.yieldState = ystate;
        
        dispatch(state.name);
      });
    }
    
    function finalize(state) {
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.  Proceed to load the previous state (if any)
      // and resume processing.
      store.destroy(req, state.handle, function(ierr) {
        if (ierr) { return next(err); }
        
        // Don't try and load the previous state if it's antecedent removal was the cause
        // of the error that led to this processing in the first place.
        if (err instanceof ExpiredStateError && err.state.handle === state.prev) { return next(err); };
        
        return proceed(state.prev, state);
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
