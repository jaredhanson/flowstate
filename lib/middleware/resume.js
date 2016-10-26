var SessionStore = require('../stores/session')
var MissingStateError = require('../errors/missingstateerror');

module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { from: options };
  }
  options = options || {};
  
  var from = options.from;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function resumeState(req, res, next) {
    
    function dispatch(name) {
      if (!name) { return next(new Error("Cannot resume unnamed flow")); }
      
      try {
        dispatcher._resume(name, null, req, res, next);
      } catch(ex) {
        return next(ex);
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
        if (!state) { return next(new MissingStateError("Failed to load previous state", yieldState.prev)); }
        
        req.state = state;
        // Expose the state that is yeilding control back to the previous state.
        // When the previous state is resumed, it can use this context to inform
        // its behavior.
        req.yieldState = ystate;
      
        dispatch(state.name);
      });
    }
    
    
    if (req.state) {
      var state = req.state;
      if (from && from !== state.name) {
        // State has been loaded for a state that is not the yeilding state, and
        // therefore is the state that is being resumed.
        return dispatch(state.name);
      }
      
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.  Proceed to load the previous state (if any)
      // and resume processing.
      store.destroy(req, state.handle, function(err) {
        if (err) { return next(err); }
        return proceed(state.prev, state);
      });
    } else if (req._state) {
      // State has been loaded for a state that was not the requested (and
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
