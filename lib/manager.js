var flatten = require('utils-flatten');
var dispatch = require('./utils').dispatch;
var SessionStore = require('./stores/session');


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

Manager.prototype.loadState = function(options) {
  return require('./middleware/load')(this._store, options);
};

Manager.prototype.complete = function(options) {
  return require('./middleware/complete')(this, this._store, options);
};

Manager.prototype.completeError =
Manager.prototype.completeErrorHandler = 
Manager.prototype.completeWithError = function(options) {
  return require('./middleware/completeError')(this, this._store, options);
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

Manager.prototype._dispatch = function(name, from, through, err, req, res, next) {
  if (!name) { return next(new Error("Cannot resume unnamed flow")); }
  
  console.log('$ dispatch');
  console.log(name + ' <- ' + from);
  console.log(req.state);
  console.log(req.yieldState);
  console.log('----------');
  
  var fname = req._stateTransitions === 0 ? (from || (req.yieldState && req.yieldState.name)) : (req.yieldState && req.yieldState.name);
  var tname = req._stateTransitions === 0 ? through : undefined;
  
  if (tname && tname !== req.state.name) {
    req._state = req.state;
    req.state = { name: tname };
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


module.exports = Manager;
