var uid = require('uid-safe').sync;
var clone = require('clone');

var ExpiredStateError = require('../errors/expiredstateerror');

function SessionStore(options) {
  options = options || {};
  
  this._key = options.key || 'state';
}

SessionStore.prototype.all = function(req, cb) {
  var key = this._key;
  if (!req.session || !req.session[key]) {
    return cb();
  }
  
  var obj = req.session[key];
  var arr = []
    , handles = Object.keys(obj)
    , state, h, i, len;
  for (i = 0, len = handles.length; i < len; ++i) {
    h = handles[i];
    state = clone(req.session[key][h]);
    state.handle = h;
    arr.push(state);
  }
  
  return cb(null, arr);
}

SessionStore.prototype.load = function(req, h, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }

  var state = clone(req.session[key][h]);
  state.handle = h;

  if (state.expired) {
    this.destroy(req, h, function(){});
    return cb(new ExpiredStateError('login process has timed out, please try again', state));
  } else if (options.destroy === true) {
    this.destroy(req, h, function(){});
    return cb(null, state);
  } else {
    return cb(null, state);
  }
}

SessionStore.prototype.save = function(req, state, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  state.initiatedAt = Date.now();
  
  if (req.state && req.state.handle) {
    state.prev = req.state.handle;
  }
  
  var key = this._key;
  var h = options.h || uid(8);
  req.session[key] = req.session[key] || {};
  req.session[key][h] = clone(state);
  
  return cb(null, h);
}

SessionStore.prototype.update = function(req, h, state, cb) {
  if (req.state && req.state.handle == h) {
    state.initiatedAt = req.state.initiatedAt;
    if (req.state.prev) { state.prev = req.state.prev; }
  }
  
  var key = this._key;
  req.session[key] = req.session[key] || {};
  req.session[key][h] = clone(state);
  
  return cb(null, h);
}

SessionStore.prototype.destroy = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }
  
  delete req.session[key][h];
  if (Object.keys(req.session[key]).length == 0) {
    delete req.session[key];
  }
  return cb();
}

SessionStore.prototype.expire = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }

  req.session[key][h].expired = true;
  return cb();
}


module.exports = SessionStore;
