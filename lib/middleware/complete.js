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
      if (!name) { return next(new Error("Cannot resume unnamed flow")); }
      
      function cont(err) {
        // TODO: Test case for transition error
        dispatcher._resume(name, err, req, res, next);
      }
      
      var yname = from || (req.yieldState && req.yieldState.name);
      if (yname) {
        dispatcher._transition(name, yname, null, req, res, cont);
      } else {
        cont();
      }
    }
    
    function proceed(h, ystate) {
      if (!h) {
        // No state to resume.  `next` middleware is expected to implement
        // default behavior for responding to the request.
        return next();
      }
      
      store.load(req, h, function(err, state) {
        if (err) { return next(err); }
        if (!state) { return next(new MissingStateError("Failed to load parent state", ystate.up)); }
        
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
      store.destroy(req, state.handle, function(err) {
        if (err) { return next(err); }
        // TODO: Replace this with "up" (for parent transaction)
        // https://tools.ietf.org/html/draft-kelly-json-hal-06
        return proceed(state.up, state);
      });
    }
    
    
    // At this point, the request is ready to be dispatched to the middleware
    // chain that will resume processing of the parent state.  This
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
