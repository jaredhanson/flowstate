var State = require('./state')
  , SessionStore = require('./stores/session')
  , completeState = require('./middleware/complete')
  , completeStateError = require('./middleware/completeError')
  , unfinishedState = require('./middleware/unfinished')
  , MissingStateError = require('./errors/missingstateerror')
  , dispatch = require('./utils').dispatch
  , flatten = require('utils-flatten')
  , debug = require('debug')('flowstate');


function Manager(options, store) {
  if (!store) { store = new SessionStore(options); }
  
  this._states = {};
  this._yielders = {};
  this._store = store;
}

Manager.prototype.use = function(name, state) {
  //begin = begin && flatten(Array.prototype.slice.call(begin, 0));
  //resume = resume && flatten(Array.prototype.slice.call(resume, 0));
  //finish = finish && flatten(Array.prototype.slice.call(finish, 0));
  
  this._states[name] = {
    launch: state.launch && flatten(Array.prototype.slice.call(state.launch, 0)),
    start: null,
    resume: state.resume && flatten(Array.prototype.slice.call(state.resume, 0)),
    process: state.process && flatten(Array.prototype.slice.call(state.process, 0)),
    finish: state.finish && flatten(Array.prototype.slice.call(state.finish, 0))
  };
}

Manager.prototype.yield = function(to, from, fns) {
  if (!Array.isArray(fns)) {
    fns = [ fns ];
  }
  
  fns = fns && flatten(Array.prototype.slice.call(fns, 0));
  this._yielders[to + '|' + from] = fns;
}

Manager.prototype.flow = function(name, options) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this._store);
  args.unshift(this);
  
  return require('./middleware/flow').apply(null, args);
};

Manager.prototype.goto = function(name, options, req, res, next) {
  if (typeof next !== 'function') {
    next = res;
    res = req;
    req = options;
    options = undefined;
  }
  
  var flow = this._states[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  //if (!flow) { return next(new Error("Cannot find flow '" + name + "'")); }
  if (!flow.launch) { throw new Error("Unable to launch state '" + name + "'"); }
  
  if (options) {
    req.locals = options;
  }
  dispatch(flow.launch)(null, req, res, next);
}

Manager.prototype._complete = function(options, err, req, res, next) {
  var self = this
    , store = this._store
  
  var through = options.through;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  debug('complete %O (handle: %s, keep: %o, modified: %o)', req.state, req.state.handle,
    req.state.isKeeped(), req.state.isModified());
  
  function dispatch() {
    return self._dispatch(through, err, req, res, next);
  }
  
  function proceed(h, ystate) {
    if (!h) {
      // TODO: Clean this up
      if (through) {
        return self._through(through, err, req, res, next);
      }
      
      // No state to resume.  `next` middleware is expected to implement
      // default behavior for responding to the request.
      return next(err);
    }
    
    store.load(req, h, function(ierr, state) {
      if (ierr) { return err ? next(err) : next(ierr); }
      if (!state) {
        if (err) { return next(err); }
        return (ystate && ystate.parent)
          ? next(new MissingStateError("Failed to load parent state", h))
          : next(new MissingStateError("Failed to load state", h));
      }
      
      // Resume the parent state by setting its state at `req.state` and
      // dispatching.  The state that is yeilding control back to the parent
      // state is made available at `req.yieldState` so the context can be used
      // to inform how to continuing processing the request.
      req.state = new State(req, state, h);
      req.yieldState = ystate;
      dispatch();
    });
  }
  
  if (req._state) {
    // The state to be resumed has been loaded in an optimized manner.  Dispatch
    // directly to the state, yielding the current state, avoiding any
    // unnecessary operations against the state store.  Specifically, the state
    // being resumed is already loaded and the yeilding state is not persisted
    // and therefore does not need to be destroyed.  Furthermore, the yielding
    // state has parent state, and does not need saved in order to be kept.
    req.yieldState = req.state;
    req.state = req._state;
    delete req._state;
    return dispatch();
  } else {
    function continue1() {
      if (req.state.isExternal()) {
        proceed(null, req.state);
      } else if (req.state.isNew() && !req.yieldStateStack) {
        // The current state is a new state, and the first state to be completed
        // in this transaction.  Resume the parent state, as indicated by the
        // state parameter carried in the request.
        proceed(getHandle(req), req.state);
      } else {
        // The current state is an existing state.  Resume the parent state as
        // indicated by the parent property of the state itself.
        return proceed(req.state.parent, req.state);
      }
    }
    
    // The current state is complete, and is yielding to its parent state, if
    // any.
    if (req.state.isKeeped()) {
      if (req.state.isNew() || req.state.isModified()) {
        req.state.save(function(ierr) {
          if (ierr) { return next(ierr); }
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
}

Manager.prototype._through = function(through, err, req, res, next) {
  req.yieldState = req.state;
  req.state = new State(req, { name: through }, undefined, false, true);
  return this._dispatch(null, err, req, res, next);
}

Manager.prototype._dispatch = function(through, err, req, res, next) {
  var name = req.state.name;
  
  if (!name) { return next(new Error("Cannot resume unnamed flow")); }
  
  if (through && through !== req.state.name) {
    req._state = req.state;
    req.state = new State(req, { name: through }, undefined, false, true);
    req.state.parent = req._state.handle;
    return this._dispatch(null, err, req, res, next);
  }
  
  debug('resume %O (handle: %s) yielding %O', req.state, req.state.handle, req.yieldState);
  
  var self = this;
  
  function cont(err) {
    // TODO: Test case for transition error
    self._continue(err, req, res, next);
  }

  // TODO: Make sure transition errors get plumbed through correctly
  this._yield(err, req, res, cont);
}

Manager.prototype._continue = function(err, req, res, next) {
  var name = req.state.name;
  var state = this._states[name];
  if (!state) { return next(new Error("Unknown state '" + name + "'")); }
  if (!state.resume) { return next(new Error("Unable to resume state '" + name + "'")); }
  
  // TODO: Allow for options here?
  var complete = completeState(this, {});
  var completeError = completeStateError(this, {});
  var unfinished = unfinishedState();
  
  var stack = state.resume.concat([complete, completeError]);
  if (state.process) {
    // TODO: test cases for this
    stack.push.apply(stack, state.process)
  }
  if (state.finish) {
    stack.push.apply(stack, state.finish)
  }
  stack.push(unfinished);
  
  req._skipCompleteStateError = false;
  dispatch(stack)(err, req, res, next);
}

Manager.prototype._yield = function(err, req, res, next) {
  var t = req.state.name
    , f = req.yieldState.name;
  
  req.yieldStateStack = req.yieldStateStack || [];
  req.yieldStateStack.unshift(req.yieldState);
  
  var stack = this._yielders[t + '|' + f];
  if (!stack) { return next(err); }
  dispatch(stack)(err, req, res, next);
}


module.exports = Manager;
