var SessionStore = require('../stores/session')
var MissingStateError = require('../errors/missingstateerror');

module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  var from = options.name;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function completeState(req, res, next) {
    function dispatch(name) {
      
      function cont(err) {
        if (!name) { return next(new Error("Cannot resume unnamed flow")); }
        
        // TODO: Test case for transition error
        dispatcher._resume(name, err, req, res, next);
      }

      // If we have a name, then there is a previous state to transition through
      // and then resume. If we do not have a name then there is no previous state
      // and we should look for a default transition that will then pass off to the
      // `next` middleware, which will be expected to provide default behavior.
      var yname, post;
      if (name) {
        yname = from || (req.yieldState && req.yieldState.name);
        post  = cont;
      } else {
        yname = from || (req.state && req.state.name);
        post  = next;
      }
      
      if (yname) {
        dispatcher._transition(name, yname, null, req, res, post);
      } else {
        post();
      }
    }
    
    function proceed(h, ystate) {
      if (!h) {
        return dispatch();
      }
      
      store.load(req, h, function(err, state) {
        if (err) { return next(err); }
        if (!state) {
          return (ystate && ystate.prev)
            ? next(new MissingStateError("Failed to load previous state", ystate.prev))
            : next(new MissingStateError("Failed to load state", h));
        }
        
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
      store.destroy(req, state.handle, function(err) {
        if (err) { return next(err); }
        return proceed(state.prev, state);
      });
    }
    
    
    // At this point, the request is ready to be dispatched to the middleware
    // chain that will resume processing of the previous state.  This
    // currently executing middleware is paired with `resumeStateError` on the
    // middleware chain for the current request.
    //
    // If an error occurs while processing the resume middleware chain, we
    // want to avoid a double-dispatch when `resumeStateError` is invoked.  As
    // such, we set a flag to check for that condition.  This effectively
    // ensures that `resumeStateError` executes only for non-state-related
    // errors.
    req._skipResumeError = true;
    
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
