var SessionStore = require('../stores/session');


module.exports = function(flows, store, options) {
  options = options || {};
  
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function resumeState(req, res, next) {
    function dispatch(name) {
      if (!name) { return next(new Error("Cannot resume unnamed flow")); }
      
      try {
        flows._resume(name, null, req, res, next);
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
        if (!state) { return next(new Error("Cannot resume unnamed flow (state not found)")); }
      
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
      
      if (options.from && options.from !== state.name) {
        return dispatch(state.name);
      }
      
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.
      store.destroy(req, state.handle, function(err) {
        if (err) { return next(err); }
        return proceed(state.prev, state);
      });
    } else {
      return proceed(getHandle(req));
    }
  };
};
