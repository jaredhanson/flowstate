/**
 * Module dependencies.
 */
var MissingStateError = require('../errors/missingstateerror');


/**
 * Complete state.
 *
 * This middleware is used to complete a stateful interaction.
 */
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
      dispatcher._dispatch(name, from, null, req, res, next);
      /*
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
      */
    }
    
    function proceed(h, ystate) {
      if (!h) {
        // No state to resume.  `next` middleware is expected to implement
        // default behavior for responding to the request.
        return next();
      }
      
      store.load(req, h, function(err, state) {
        if (err) {
          // WIP: Dispatch this error to parent state
          //if (err.state) { req.state = err.state; }
          return next(err);
        }
        if (!state) {
          return (ystate)
            ? next(new MissingStateError("Failed to load previous state", h))
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
      // fact that it is complete.  Proceed to load the parent state (if any)
      // and resume processing.
      store.destroy(req, state.handle, function(err) {
        if (err) { return next(err); }
        return proceed(state.prev, state);
      });
    }
    
    
    // At this point, the request is ready to be dispatched to the middleware
    // chain that will resume processing of the parent state, if any.  This
    // currently executing middleware is paired with `completeError` on the
    // middleware chain for the current request.
    //
    // If an error occurs while resuming the parent state, we want to avoid a
    // double-dispatch when `completeError` is invoked.  As such, we set a flag
    // to check for that condition.  This effectively ensures that
    // `completeError` executes only for errors encountered in the processing of
    // the current state.
    req._skipResumeError = true;
    
    if (req.state) {
      if (from && from !== req.state.name) {
        // State has been loaded for a state that is not the yeilding state, and
        // therefore is the state that is being resumed.  Dispatch the request
        // to that state's resume middleware chain for processing.
        return dispatch(req.state.name);
      }
      
      // State has been loaded for the current, and now yeilding, state.
      // Finalize the state, removing it from any persistent storage now that
      // the state is complete and no longer needed.  Once the state has been
      // removed, the parent state (if any) will be resumed.
      return finalize(req.state);
    } else if (req._state) {
      // State has been loaded for a state that was not the expected, and now
      // yielding, state, and therefore is the state that is being resumed.
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
