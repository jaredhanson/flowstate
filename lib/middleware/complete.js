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
  
  var from = options.name
    , through = options.through
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function completeState(req, res, next) {
    req._stateTransitions = req._stateTransitions || 0;
    
    function dispatch(name) {
      return dispatcher._dispatch(name, from, null, req, res, next);
      
      if (!name) { return next(new Error("Cannot resume unnamed flow")); }
      
      req._stateTransitions++;
      
      function cont(err) {
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
        //err = new Error('wtf')
        //err.state = state
        
        if (err) { return next(err); }
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
        
        if (through && through !== state.name  && !req.__throughTask) {
          //console.log('NEED TO DISPATH THROUGH: ' + through);
          //console.log('HOWEVER, WE HAVE');
          //console.log(state)
          
          req.yieldState = ystate;
          
          req._state = req.state;
          req.state = { name: through };
          req.state.prev = req._state.handle;
          
          req.__throughTask = true;
          
          return dispatch(through);
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
    
    console.log('@COMPLETE # ' + req._stateTransitions);
    console.log('  name: ' + (req.state ? req.state.name : 'unloaded'))
    
    if (req.state) {
      //console.log(from)
      //console.log(req.state.name)
      
      if (from && from !== req.state.name && !req.__finishedTask) {
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
