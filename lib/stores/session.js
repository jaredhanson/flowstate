var uid = require('uid-safe').sync;
var clone = require('clone');

// TODO: Match this more similarly to express ession store with jsut get, set, touch

function SessionStore(options) {
  options = options || {};
  
  //console.log(options)
  
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

SessionStore.prototype.load = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }

  var state = clone(req.session[key][h]);
  return cb(null, state);
}

SessionStore.prototype.save = function(req, state, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  var key = this._key;
  var h = options.handle || this._generateHandle();
  req.session[key] = req.session[key] || {};
  req.session[key][h] = clone(state);
  return cb(null, h);
}

SessionStore.prototype.set = function(req, h, state, cb) {
  var key = this._key;
  req.session[key] = req.session[key] || {};
  req.session[key][h] = clone(state);
  return cb(null);
}

SessionStore.prototype.destroy = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }
  
  //console.log('> destroying state...');
  //console.log(h)
  
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
