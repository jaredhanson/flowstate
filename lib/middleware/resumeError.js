var SessionStore      = require('../stores/session');
var ExpiredStateError = require('../errors/expiredstateerror');
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
  
  
  return function resumeStateError(err, req, res, next) {
    console.log('## resumeStateError');
    console.log('SKIP ERROR:  ' + req._skipResumeError);
    //console.log(req.state);
    
    if (req._skipResumeError) { console.log('SKIPPED!'); return next(err); }
    
    
    console.log(err);
    //console.log(err.stack)
    console.log(options)
    console.log(req.state);
    console.log(req._state);
    console.log('--')
    
    
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
        return next();
      }
      
      store.load(req, h, function(err, state) {
        if (err) { return next(err); }
        if (!state) { return next(new MissingStateError("Failed to load previous state", ystate.prev)); }
        
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
    
    return;
    
    // FIXME: Remove below here, once working.
    
    
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
          dispatcher._resume(name, err, req, res, next);
        } catch(ex) {
          return next(ex);
        }
      })
    });
  };
};
