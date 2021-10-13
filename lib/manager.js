var State = require('./state')
  , SessionStore = require('./stores/session')
  , MissingStateError = require('./errors/missingstateerror')
  , dispatch = require('./utils').dispatch
  , dispatchReal = dispatch
  , flatten = require('utils-flatten')
  , uri = require('url')
  , debug = require('debug')('flowstate');


function Manager(options, store) {
  if (!store) { store = new SessionStore(options); }
  
  this._store = store;
}

Manager.prototype._complete = function(options, err, req, res, next) {
  var self = this
    , store = this._store
  
  var cont = options.continue;
  //var through = options.through;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  debug('complete %O (handle: %s, modified: %o, new: %o)', req.state, req.state.handle,
    req.state.isModified(), req.state.isNew());
  
  function dispatch(ystate) {
    return self._dispatch(options, err, req, res, next, ystate);
  }
  
  function proceed(h, ystate) {
    if (!h) {
      console.log('P0');
      
      // TODO: Clean this up
      /*
      if (through) {
        return self._through(through, err, req, res, next);
      }
      */
      
      console.log('P00');
      console.log(err);
      
      // No state to resume.  `next` middleware is expected to implement
      // default behavior for responding to the request.
      if (options.postFns) {
        dispatchReal(options.postFns)(err, req, res, function(err) {
          if (cont) {
            console.log('NEED TO CONTINUE TO: ' + cont);
            res.redirect(cont);
            return;
          }
          
          return next(err);
        });
        return;
      } else {
        if (cont) {
          console.log('NEED TO DEF CONTINUE TO: ' + cont);
          res.redirect(cont);
          return;
        }
        
        return next(err);
      }
    }
    
    store.load(req, h, function(ierr, state) {
      if (ierr) { return err ? next(err) : next(ierr); }
      if (!state) {
        if (err) { return next(err); }
        return (ystate && ystate.state)
          ? next(new MissingStateError("Failed to load parent state", h))
          : next(new MissingStateError("Failed to load state", h));
      }
      
      // Resume the parent state by setting its state at `req.state` and
      // dispatching.  The state that is yeilding control back to the parent
      // state is made available at `req.yieldState` so the context can be used
      // to inform how to continuing processing the request.
      req.state = new State(req, state, h);
      dispatch(ystate);
    });
  }
  
  if (req._state) {
    console.log('C1');
    
    // The state to be resumed has been loaded in an optimized manner.  Dispatch
    // directly to the state, yielding the current state, avoiding any
    // unnecessary operations against the state store.  Specifically, the state
    // being resumed is already loaded and the yeilding state is not persisted
    // and therefore does not need to be destroyed.  Furthermore, the yielding
    // state has parent state, and does not need saved in order to be kept.
    req.state = req._state;
    delete req._state;
    return dispatch();
  } else {
    console.log('C2');
    
    function continue1() {
      if (req.state.isExternal()) {
        console.log('C2-1');
        console.log(req.state);
        
        if (req.state.isModified()) {
          // NEW
          console.log('IN COMPLETE');
          
          return self._continue(null, req, res, next);
        }
        
        proceed(null, req.state);
      } else if (req.state.isNew()) {
        console.log('C2-2');
        
        // The current state is a new state, and the first state to be completed
        // in this transaction.  Resume the parent state, as indicated by the
        // state parameter carried in the request.
        proceed(getHandle(req), req.state);
      } else {
        console.log('C2-3');
        
        // The current state is an existing state.  Resume the parent state as
        // indicated by the parent property of the state itself.
        return proceed(req.state.state, req.state);
        // NEW:
        //return proceed(req.state.returnTo, req.state);
      }
    }
    
    function continue0() {
    // The current state is complete, and is yielding to its parent state, if
    // any.
    //if (req.state.isKeeped()) {
    //if (0) {
    if (req.state.returnTo) {
      // NEW condition, can be cleaned up, probably
      if (req.state.isNew() || req.state.isModified()) {
        req.state.save(function(ierr) {
          if (ierr) { return next(ierr); }
          continue1();
        });
      } else if (req.state.state || !req.state.isModified()) {
        // TODO: Clean this up and make it more generic
        //if (req.state.returnTo && !req.state.state && req.url !== req.state.returnTo) {
        //if (req.state.returnTo && req.url !== req.state.returnTo) {
        //if (ru !== req.state.recipient) {
        //  return continue1();
        //}
        if (!req.state.isComplete()) {
          return continue1();
        }
        
        // Resuming a parent state, current state is implicity complete
        req.state.destroy(function(ierr) {
          if (ierr) { return err ? next(err) : next(ierr); }
          continue1();
        });
      } else {
        continue1();
      }
    } else {
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.
      req.state.destroy(function(ierr) {
        if (ierr) { return err ? next(err) : next(ierr); }
        continue1();
      });
    }
  }
  } // continue0
  
  //if (options.postFns && req.state._meta.preventDefault == true) {
  //if (options.postFns) {
  if (0) {
    dispatchReal(options.postFns)(err, req, res, function(err) {
      // TODO: handle err, with test case
      continue0();
    });
  } else {
    continue0();
  }
}

/*
Manager.prototype._through = function(through, err, req, res, next) {
  req.yieldState = req.state;
  req.state = new State(req, { name: through }, undefined, false, true);
  return this._dispatch(null, err, req, res, next);
}
*/

// TODO: clean up these arguments, in particular ystate being last
Manager.prototype._dispatch = function(options, err, req, res, next, ystate) {
  // NEW yieldstate return to option.
  //var through = options ? options.through : null;
  
  // dead code, can be deleted
  /*
  if (through && through !== req.state.name) {
    req._state = req.state;
    req.state = new State(req, { name: through }, undefined, false, true);
    req.state.state = req._state.handle;
    return this._dispatch(null, err, req, res, next);
  }
  */
  
  debug('resume %O (handle: %s) yielding %O', req.state, req.state.handle, req.yieldState);
  
  var self = this;
  
  function cont(err) {
    // TODO: Test case for transition error
    self._continue(err, req, res, next, ystate);
  }

  // TODO: Make sure transition errors get plumbed through correctly
  //this._yield(options, err, req, res, cont);
  cont();
}

Manager.prototype._continue = function(err, req, res, next, ystate) {
  //name = uri.parse(name).pathname; // TODO: test case for query parsing
  
  // NEW
  var url = ystate && ystate.returnTo;
  if (url) {
    return res.redirect(url);
  }
  
  return;
  
  /*
  if (!state) { return next(new Error("Unknown state '" + name + "'")); }
  if (!state.resume) { return next(new Error("Unable to resume state '" + name + "'")); }
  
  // TODO: Allow for options here?
  var complete = completeState(this, {});
  var completeError = completeStateError(this, {});
  var unfinished = unfinishedState();
  
  var stack = state.resume.concat([complete, completeError]);
  if (state.exit) {
    stack.push.apply(stack, state.exit)
  }
  stack.push(unfinished);
  
  req._skipCompleteStateError = false;
  dispatch(stack)(err, req, res, next);
  */
}

Manager.prototype._yield = function(options, err, req, res, next) {
  return next();
  
  // FIXME: there are two tests (in sso/oauth and sso/oauth2 that dependend on this code)
  //        factor the fix somewhere else.  It is probalby the `postFns` related code here
  
  // TODO: Comment out this whole piece and fix tests.  Nothing depends on yields anymore
  /*
  var t = req.state.name || (req.yieldState && req.yieldState.returnTo)
    , f = req.yieldState.name || req.originalUrl || req.url;
  
  t = uri.parse(t).pathname; // TODO: test case for query parsing
  f = uri.parse(f).pathname; // TODO: test case for query parsing
  
  req.yieldStateStack = req.yieldStateStack || [];
  req.yieldStateStack.unshift(req.yieldState);
  
  var stack = this._yielders[t + '|' + f];
  if (!stack) {
    if (options && options.postFns) {
      dispatchReal(options.postFns)(err, req, res, function(err) {
        // TODO: handle err, with test case
        return next(err);
      });
      return;
    }
  
    return next(err);
  }
  dispatch(stack)(err, req, res, next);
  */
}

module.exports = Manager;
