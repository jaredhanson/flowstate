/**
 * Module dependencies.
 */
var State = require('../state')
  , ExpiredStateError = require('../errors/expiredstateerror');


/**
 * Complete state with error.
 *
 * This middleware is used to complete a stateful interaction with an error.
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
  
  
  return function completeStateError(err, req, res, next) {
    if (req._skipResumeError) { return next(err); }
    
    req._stateTransitions = req._stateTransitions || 0;
    // TODO: Remove the function type check
    if (req.state && typeof req.state.complete == 'function') { req.state.complete(); }
    
    return dispatcher._complete(options, err, req, res, next);
    
    
    
    function dispatch(name) {
      return dispatcher._dispatch(name, from, through, err, req, res, next);
    }
    
    function proceed(h, ystate) {
      if (!h) {
        // TODO: Clean this up
        if (through && ystate) {
          return dispatcher._through(through, err, req, res, next);
        }
        
        // No state to resume.  `next` middleware is expected to implement
        // default behavior for responding to the request.
        return next(err);
      }
      
      store.load(req, h, function(ierr, state) {
        if (ierr) { return next(err); }
        if (!state) { return next(err); }
        
        req.state = new State(req, state, h);
        
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
    
    console.log('@FAILED # ' + req._stateTransitions);
    console.log('  name: ' + (req.state ? req.state.name : 'unloaded'))
    
    if (req._state) {
      // State has been loaded for a state that was not the expected (and
      // yielding) state, and therefore is the state that is being resumed.
      // This is an optimization, supported by a prior call to `loadState`
      // with a specified name option.
      req.yieldState = req.state;
      req.state = req._state;
      delete req._state;
      return dispatch(req.state.name);
    } else if (req.state) {
      if (from && from !== req.state.name) {
        // State has been loaded for a state that is not the yeilding state, and
        // therefore is the state that is being resumed.
        return dispatch(req.state.name);
      }
      
      //finalize(req.state);
      if (req.state.isNew && req.state.isNew()) {
        return proceed(getHandle(req), req.state);
      } else {
        return finalize(req.state);
      }
    } else {
      return proceed(getHandle(req));
    }
  };
};
