var clone = require('clone');


function SessionStore(options) {
  options = options || {};
  this._key = options.key || 'state';
}

SessionStore.prototype.all = function(req, cb) {
  var key = this._key;
  if (!req.session || !req.session[key]) {
    return cb();
  }
  
  var arr = []
    , handles = Object.keys(req.session[key])
    , state, h, i, len;
  for (i = 0, len = handles.length; i < len; ++i) {
    h = handles[i];
    state = clone(req.session[key][h]);
    if (typeof state.expires === 'string') {
      // convert expires to a Date object
      state.expires = new Date(state.expires)
    }
    state.handle = h;
    arr.push(state);
  }
  
  return cb(null, arr);
}

SessionStore.prototype.get = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }

  var state = clone(req.session[key][h]);
  if (typeof state.expires === 'string') {
    // convert expires to a Date object
    state.expires = new Date(state.expires)
  }
  return cb(null, state);
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
