var flatten = require('utils-flatten');
var dispatch = require('./utils').dispatch;
var SessionStore = require('./stores/session');
var State = require('./state');
var MissingStateError = require('./errors/missingstateerror');


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

Manager.prototype._resume = function(name, err, req, res, next) {
  var flow = this._flows[name];
  if (!flow) { return next(new Error("Cannot find flow '" + name + "'")); }
  if (!flow.resume) { return next(new Error("Cannot resume flow '" + name + "'")); }
  
  // TODO: Allow for options here?
  var comp = require('./middleware/complete')(this, this._store);
  var compErr = require('./middleware/completeError')(this, this._store);
  
  var arr = flow.resume.concat([comp, compErr]);
  if (flow.finish) {
    arr = arr.concat(flow.finish)
  }
  
  dispatch(arr)(err, req, res, next);
}

Manager.prototype._transition = function(name, from, err, req, res, next) {
  var trans = this._stt[name + '|' + from];
  if (!trans) { return next(err); }
  
  dispatch(trans)(err, req, res, next);
}

Manager.prototype._through = function(through, err, req, res, next) {
  req.yieldState = req.state;
  req.state = new State(req, { name: through });
  return this._dispatch(through, req.yieldState.name, null, err, req, res, next);
}

Manager.prototype._dispatch = function(name, from, through, err, req, res, next) {
  if (!name) { return next(new Error("Cannot resume unnamed flow")); }
  
  console.log('$ dispatch');
  console.log(name + ' <- ' + from);
  console.log('through: ' + through)
  console.log(req.state);
  console.log(req.yieldState);
  console.log('----------');
  
  var fname = req._stateTransitions === 0 ? (from || (req.yieldState && req.yieldState.name)) : (req.yieldState && req.yieldState.name);
  var tname = req._stateTransitions === 0 ? through : undefined;
  
  if (tname && tname !== req.state.name) {
    req._state = req.state;
    req.state = new State(req, { name: tname });
    req.state.prev = req._state.handle;
    return this._dispatch(tname, from, null, err, req, res, next);
  }
  
  req._stateTransitions++;
  
  var self = this;
  
  function cont(err) {
    // TODO: Test case for transition error
    self._resume(name, err, req, res, next);
  }
  
  if (fname) {
    // TODO: Make sure transition errors get plumbed through correctly
    this._transition(name, fname, err, req, res, cont);
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
  
  
  function dispatch(name) {
    return self._dispatch(name, from, through, null, req, res, next);
  }
  
  function proceed(h, ystate) {
    if (!h) {
      // TODO: Clean this up
      if (through && ystate) {
        return self._through(through, null, req, res, next);
      }
      
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
    // fact that it is complete.  Proceed to load the parent state (if any)
    // and resume processing.
    store.destroy(req, state.handle, function(err) {
      if (err) { return next(err); }
      return proceed(state.prev, state);
    });
  }
  
  
  if (req._state) {
    // State has been loaded for a state that was not the expected, and now
    // yielding, state, and therefore is the state that is being resumed.
    // This is an optimization, supported by a prior call to `loadState`
    // with a specified name option.
    req.yieldState = req.state;
    req.state = req._state;
    delete req._state;
    return dispatch(req.state.name);
  } else if (req.state) {
    //console.log(from)
    //console.log(req.state.name)
    
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
    if (req.state.isNew && req.state.isNew()) {
      return proceed(getHandle(req), req.state);
    } else {
      return finalize(req.state);
    }
  } else {
    return proceed(getHandle(req));
  }
}


module.exports = Manager;
