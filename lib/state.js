// Module dependencies.
var Meta = require('./meta')
  , crc = require('crc').crc32;


/**
 * Create a new `State` with the given request and `data`.
 *
 * @protected
 * @class
 */
function State(req, data, handle, external) {
  Object.defineProperty(this, '_req', { value: req });
  Object.defineProperty(this, 'handle', { value: handle, writable: true });
  Object.defineProperty(this, 'external', { value: external });
  Object.defineProperty(this, '_meta', { value: new Meta() });
  
  if (data.handle) {
    this.handle = data.handle;
  }
  
  if (typeof data === 'object' && data !== null) {
    // merge data into this, ignoring prototype properties
    for (var prop in data) {
      if (!(prop in this)) {
        this[prop] = data[prop];
      }
    }
  }
  
  if (typeof this.expires === 'string') {
    // convert expires to a Date object
    this.expires = new Date(this.expires);
  }
  
  this._meta.originalHash = hash(this);
  if (this.handle) {
    this._meta.savedHash = this._meta.originalHash;
  }
}

defineMethod(State.prototype, 'complete', function complete(v) {
  this._meta.complete = v !== undefined ? v : true;
  return this;
});

defineMethod(State.prototype, 'returning', function returning(v) {
  this._meta.returning = v !== undefined ? v : true;
  return this;
});

defineMethod(State.prototype, 'save', function save(options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  cb = cb || function(){};
  
  // TODO: Better method name for this?  isDirty?
  if (this.isSaved()) { return cb(); }
  
  this._meta.savedHash = hash(this);
  
  this._req.stateStore.set(this._req, this.handle, this, function(err) {
    if (err) { return cb(err); }
    return cb();
  });
});

defineMethod(State.prototype, 'destroy', function destroy(cb) {
  if (!this.handle) { return cb(); }
  
  var self = this;
  this._req.stateStore.destroy(this._req, this.handle, function(err) {
    if (err) { return cb(err); }
    self.handle = null;
    self._meta.destroyed = true;
    return cb();
  });
});

/**
 * Test if state has been modified.
 *
 * @return {boolean}
 * @access protected
 */
defineMethod(State.prototype, 'isModified', function isModified() {
  return this._meta.originalHash !== hash(this);
});

/**
 * Test if state has been saved.
 *
 * @return {boolean}
 * @access protected
 */
defineMethod(State.prototype, 'isSaved', function isSaved() {
  return this._meta.savedHash === hash(this);
});

defineMethod(State.prototype, 'isNew', function isNew() {
  // TODO: test case for the !destroyed case
  // TODO: destroyed can be removed, with a strict check for handle === undefined
  return !this.handle && !this._meta.destroyed;
});

defineMethod(State.prototype, 'isComplete', function isDirty() {
  return this._meta.complete;
});

defineMethod(State.prototype, 'isReturning', function isReturning() {
  return this._meta.returning;
});


module.exports = State;




/**
 * Hash the given `state` object.
 *
 * @param {Object} state
 * @return {String}
 * @access private
 */
function hash(state) {
  return crc(JSON.stringify(state, function (key, val) {
    // ignore state._meta property
    if (this === state && key === '_meta') {
      return
    }

    return val;
  }));
}

/**
 * Helper function for creating a method on a prototype.
 *
 * @param {Object} obj
 * @param {String} name
 * @param {Function} fn
 * @access private
 */
function defineMethod(obj, name, fn) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: false,
    value: fn,
    writable: true
  });
};
