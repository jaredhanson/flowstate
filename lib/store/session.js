// Module dependencies.
var Store = require('../store');
var clone = require('clone');
var util = require('util');


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
  Store.call(this);
  this._key = options.key || 'state';
}

// Inherit from `Store`.
util.inherits(SessionStore, Store)

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
  if (!req.session) { return cb(new Error('State requires session support. Did you forget to use `express-session` middleware?')); }
  
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
    state.handle = h;
    arr.push(state);
  }
  return cb(null, arr);
}

/**
 * Fetch state by the given state handle.
 *
 * @public
 * @param {IncomingRequest} req
 * @param {string} handle
 * @param {function} callback
 * @param {Error} callback.err
 * @param {object} callback.state
 */
SessionStore.prototype.get = function(req, h, cb) {
  if (!req.session) { return cb(new Error('State requires session support. Did you forget to use `express-session` middleware?')); }
  
  var key = this._key;
  if (!req.session[key] || !req.session[key][h]) {
    return cb();
  }

  var state = clone(req.session[key][h]);
  return cb(null, state);
}

/**
 * Commit the given state associated with the given state handle to the store.
 *
 * @param {IncomingRequest} req
 * @param {string} handle
 * @param {object} state
 * @param {function} callback
 * @param {Error} callback.err
 * @public
 */
SessionStore.prototype.set = function(req, h, state, cb) {
  if (!req.session) { return cb(new Error('State requires session support. Did you forget to use `express-session` middleware?')); }
  
  var key = this._key;
  req.session[key] = req.session[key] || {};
  req.session[key][h] = JSON.parse(JSON.stringify(state));
  return cb(null);
}

/**
 * Destroy the state associated with the given state handle.
 *
 * @param {IncomingRequest} req
 * @param {string} handle
 * @param {function} callback
 * @param {Error} callback.err
 * @public
 */
SessionStore.prototype.destroy = function(req, h, cb) {
  if (!req.session) { return cb(new Error('State requires session support. Did you forget to use `express-session` middleware?')); }
  
  var key = this._key;
  if (!req.session[key] || !req.session[key][h]) {
    return cb();
  }
  
  delete req.session[key][h];
  if (Object.keys(req.session[key]).length == 0) {
    delete req.session[key];
  }
  return cb();
}

// Export `SessionStore`.
module.exports = SessionStore;
