// Module dependencies.
var clone = require('clone');


/**
 * Create a new session-based state store.
 *
 * @public
 * @class
 * @param {Object} [options]
 * @param {string} [options.key='state'] - Determines what property ("key") on
 *          the session object where state is located.  The state data is stored
 *          and read from `req.session[key]`.
 */
function SessionStore(options) {
  options = options || {};
  this._key = options.key || 'state';
}

/**
 * Get all states.
 *
 * @param {IncomingRequest} req
 * @param {function} callback
 * @param {Error} callback.err
 * @param {object[]} callback.states
 * @public
 */
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
      state.expires = new Date(state.expires);
    }
    state.handle = h;
    arr.push(state);
  }
  
  return cb(null, arr);
}

/**
 * Fetch state by the given state handle.
 *
 * @param {IncomingRequest} req
 * @param {string} handle
 * @param {function} callback
 * @param {Error} callback.err
 * @param {object} callback.state
 * @public
 */
SessionStore.prototype.get = function(req, h, cb) {
  var key = this._key;
  if (!req.session || !req.session[key] || !req.session[key][h]) {
    return cb();
  }

  var state = clone(req.session[key][h]);
  if (typeof state.expires === 'string') {
    // convert expires to a Date object
    state.expires = new Date(state.expires);
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


module.exports = SessionStore;
