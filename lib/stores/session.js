var uid = require('uid-safe').sync;
var clone = require('clone');

var ExpiredStateError = require('../errors/expiredstateerror');

function SessionStore(options) {
  options = options || {};
  
  console.log(options)
  
  this._key = options.key || 'state';
  this._generateHandle = options.genh || function() { return uid(8); }
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
  //state.handle = h;

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
  
  console.log('> saving state...');
  console.log(state)
  console.log(JSON.stringify(state));
  
  state.initiatedAt = state.initiatedAt || Date.now();
  
  var key = this._key;
  var h = options.h || this._generateHandle();
  req.session[key] = req.session[key] || {};
  req.session[key][h] = clone(state);
  
  console.log('> handle: ' + h)
  console.log(req.session[key][h])
  
  return cb(null, h);
}

SessionStore.prototype.update = function(req, h, state, cb) {
  //if (state.handle === h) { delete state.handle; }
  
  console.log('> updating state...');
  console.log(state)
  console.log(JSON.stringify(state));
  
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
  
  console.log('> destroying state...');
  console.log(h)
  
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
