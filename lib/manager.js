var flatten = require('utils-flatten');
var dispatch = require('./utils').dispatch;
var SessionStore = require('./stores/session');
var State = require('./state');
var MissingStateError = require('./errors/missingstateerror')
  , debug = require('debug')('flowstate');


function Manager(options, store) {
  if (!store) { store = new SessionStore(options); }
  
  this._flows = {};
  this._stt = {};
  this._store = store;
}

Manager.prototype.use = function(name, begin, resume, finish) {
  begin = begin && flatten(Array.prototype.slice.call(begin, 0));
  resume = resume && flatten(Array.prototype.slice.call(resume, 0));
  finish = finish && flatten(Array.prototype.slice.call(finish, 0));
  
  this._flows[name] = {
    begin: begin,
    resume: resume,
    finish: finish
  };
}

Manager.prototype.yield = 
Manager.prototype.transition = function(name, from, trans) {
  if (!Array.isArray(trans)) {
    trans = [ trans ];
  }
  
  trans = trans && flatten(Array.prototype.slice.call(trans, 0));
  this._stt[name + '|' + from] = trans;
}

Manager.prototype.goto = function(name, options, req, res, next) {
  if (typeof next !== 'function') {
    next = res;
    res = req;
    req = options;
    options = undefined;
  }
  
  var flow = this._flows[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  //if (!flow) { return next(new Error("Cannot find flow '" + name + "'")); }
  if (!flow.begin) { throw new Error("Cannot begin flow '" + name + "'"); }
  
  if (options) {
    req.locals = options;
  }
  dispatch(flow.begin)(null, req, res, next);
}

Manager.prototype.flow = function(name, options) {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this._store);
  args.unshift(this);
  
  return require('./middleware/flow').apply(null, args);
};

Manager.prototype._resume = function(err, req, res, next) {
  var name = req.state.name;
  
  var flow = this._flows[name];
  if (!flow) { return next(new Error("Cannot find flow '" + name + "'")); }
  if (!flow.resume) { return next(new Error("Cannot resume flow '" + name + "'")); }
  
  // TODO: Allow for options here?
  var comp = require('./middleware/complete')(this, this._store, {});
  var compErr = require('./middleware/completeError')(this, this._store, {});
  
  var arr = flow.resume.concat([comp, compErr]);
  if (flow.finish) {
    arr = arr.concat(flow.finish)
  }
  
  dispatch(arr)(err, req, res, next);
}

Manager.prototype._transition = function(err, req, res, next) {
  var t = req.state.name
    , f = req.yieldState.name;
  
  var trans = this._stt[t + '|' + f];
  if (!trans) { return next(err); }
  
  dispatch(trans)(err, req, res, next);
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
    self._resume(err, req, res, next);
  }
  
  if (req.yieldState) {
    // TODO: Make sure transition errors get plumbed through correctly
    this._transition(err, req, res, cont);
  } else {
    cont(err);
  }
}


Manager.prototype._complete = function(options, err, req, res, next) {
  var self = this
    , store = this._store
  
  var from = options.name
    , through = options.through
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  debug('complete %O (handle: %s)', req.state, req.state.handle);
  
  
  function dispatch() {
    return self._dispatch(through, err, req, res, next);
  }
  
  function proceed(h, ystate) {
    if (!h) {
      // TODO: Clean this up
      if (through && ystate) {
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
    // TODO: Might be able to move this into proceed, in order to handle keep in a more
    //       DRY manner
    
    // The state to be resumed has been loaded in an optimized manner.  Dispatch
    // directly to the state, yielding the current state, avoiding any
    // unnecessary operations against the state store.  Specifically, the state
    // being resumed is already loaded and the yeilding state is not persisted
    // and therefore does not need to be destroyed.
    req.yieldState = req.state;
    req.state = req._state;
    delete req._state;
    return dispatch();
  } else {
    // The current state is complete, and is yiedling to its parent state, if
    // any.
    if (req.state.isSynthentic()) {
      // FIXME: replace synthetic flag with a stateStack check
      
      // The current state is a synthetic state, meaning another state has been
      // resumed through this state.  Synthetic states are not persisted and
      // therefore do not need to be destroyed.  Resume the parent state.
      proceed(req.state.parent, req.state);
    } else if (req.state.isNew()) {
      // The current state is a new state, and is not persisted and therefore
      // does not need to be destroyed.  Resume the parent state, as indicated
      // by the state parameter carried in the request.
      proceed(getHandle(req), req.state);
    } else if (req.state.isKeeped() && req.state.isModified()) {
      // FIXME: Is it possible that new and synthetic states may need to be kept?
      
      req.state.save(function(ierr) {
        if (ierr) { return next(ierr); }
        proceed(req.state.parent, req.state);
      });
    } else if (req.state.isKeeped()) {
      proceed(req.state.parent, req.state);
    } else {
      // Remove the current state from any persistent storage, due to the
      // fact that it is complete.  Proceed to load the parent state (if any)
      // and resume processing.
      req.state.destroy(function(ierr) {
        if (ierr) { return err ? next(err) : next(ierr); }
        return proceed(req.state.parent, req.state);
      });
    }
  }
}


module.exports = Manager;
