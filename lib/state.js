var Meta = require('./meta')
  , crc = require('crc').crc32;


function State(req, data, handle, extern, synth) {
  Object.defineProperty(this, '_req', { value: req });
  Object.defineProperty(this, 'handle', { value: handle, writable: true });
  Object.defineProperty(this, 'parent', { value: null, writable: true });
  Object.defineProperty(this, '_meta', { value: new Meta(extern, synth) });
  
  if (typeof data === 'object' && data !== null) {
    // merge data into this, ignoring prototype properties
    for (var prop in data) {
      if (!(prop in this)) {
        this[prop] = data[prop];
      }
    }
  }
  
  this._meta.originalHash = hash(this);
  if (this.handle) {
    this._meta.savedHash = this._meta.originalHash;
  }
}

defineMethod(State.prototype, 'push', function push(data) {
  // TODO: Do in is comlete check on current state, and init new state accordingly with returnTo/resume
  
  if (this.handle && !this.isComplete()) {
    // FIXME: Rename this to `.state`, check the conditions
    data.state = this.handle;
  } else {
    // FIXME: Check these conditions
    if (this.state) {
      data.state = this.state;
    } else {
      data.returnTo = data.returnTo || this.returnTo;
    }
  }
  
  // TODO: Save the old state, if necessary.  Do this in the redirect/render
  // by traversing the stack
  
  // TODO: Point _req.state.prev to the parent state, so it can be destroyed on res.end (probably ins save)
  
  this.parent = this;
  this._req.state = new State(this._req, data);
  this._req.state.touch();
});

defineMethod(State.prototype, 'save', function save(options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  cb = cb || function(){};
  
  this._meta.savedHash = hash(this);
  
  var self = this;
  if (!this.handle) {
    this._req.stateStore.save(this._req, this, options, function(err, h) {
      if (err) { return cb(err); }
      self.handle = h;
      return cb();
    });
  } else {
    this._req.stateStore.update(this._req, this.handle, this, function(err, h) {
      if (err) { return cb(err); }
      self.handle = h;
      return cb();
    });
  }
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

defineMethod(State.prototype, 'touch', function touch() {
  this._meta.touched = true;
  return this;
});

defineMethod(State.prototype, 'complete', function isDirty() {
  this._meta.complete = true;
  return this;
});

/*
defineMethod(State.prototype, 'complete', function isDirty() {
  this._meta.complete = true;
  return this;
});
*/

/*
defineMethod(State.prototype, 'isComplete', function isDirty() {
  return this._meta.complete;
});
*/

defineMethod(State.prototype, 'isExternal', function isExternal() {
  return this._meta.external;
});

defineMethod(State.prototype, 'isNew', function isDirty() {
  // TODO: test case for the !destroyed case
  // TODO: destroyed can be removed, with a strict check for handle === undefined
  return !this.handle && !this._meta.destroyed;
});


/**
 * Test if state has been modified.
 *
 * @return {boolean}
 * @api protected
 */
defineMethod(State.prototype, 'isModified', function isModified() {
  return this._meta.touched || (this._meta.originalHash !== hash(this));
});

/**
 * Test if state has been saved.
 *
 * @return {boolean}
 * @api protected
 */
defineMethod(State.prototype, 'isSaved', function isSaved() {
  return this.handle && this._meta.savedHash === hash(this);
});

defineMethod(State.prototype, 'isComplete', function isDirty() {
  return this._meta.complete;
});


module.exports = State;




/**
 * Hash the given `state` object omitting changes to `._meta`.
 *
 * @param {Object} state
 * @return {String}
 * @private
 */
function hash(state) {
  return crc(JSON.stringify(state, function (key, val) {
    // ignore state._handle property
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
 * @private
 */
function defineMethod(obj, name, fn) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: false,
    value: fn,
    writable: true
  });
};
