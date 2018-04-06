var Meta = require('./meta')
  , crc = require('crc').crc32;


function State(req, data, handle) {
  Object.defineProperty(this, '_req', { value: req });
  Object.defineProperty(this, 'handle', { value: handle, writable: true });
  Object.defineProperty(this, '_meta', { value: new Meta() });
  
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

defineMethod(State.prototype, 'save', function save(cb) {
  cb = cb || function(){};
  
  this._meta.savedHash = hash(this);
  
  var self = this;
  this._req.stateStore.save(this._req, this, function(err, h) {
    console.log('STATE SAVED!!!');
    console.log(err);
    console.log(h);
    
    if (err) { return cb(err); }
    
    self.handle = h;
    
    console.log(self);
    console.log(self.handle)
    return cb();
  });
});

defineMethod(State.prototype, 'required', function required() {
  this._meta.required = true;
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

defineMethod(State.prototype, 'isNew', function isDirty() {
  return !this.handle;
});


/**
 * Test if state has been modified.
 *
 * @return {boolean}
 * @api protected
 */
defineMethod(State.prototype, 'isModified', function isModified() {
  return this._meta.originalHash !== hash(this);
});

defineMethod(State.prototype, 'isSaved', function isSaved() {
  console.log('isSaved?: ' + this.handle + ': ' + this._meta.savedHash + ' # ' + hash(this))
  console.log('  rv: ' + (this.handle && this._meta.savedHash === hash(this)))
  
  return this.handle && this._meta.savedHash === hash(this);
});

defineMethod(State.prototype, 'isRequired', function isRequired() {
  return this._meta.required;
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
