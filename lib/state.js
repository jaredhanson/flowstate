var Meta = require('./meta')
  , crc = require('crc').crc32;


function State(req, data, handle) {
  Object.defineProperty(this, 'req', { value: req });
  Object.defineProperty(this, 'handle', { value: handle });
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
}

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

defineMethod(State.prototype, 'isDirty', function isDirty() {
  console.log('comparing: ' + this.name + ': ' + this._meta.originalHash + ' # ' + hash(this))
  
  return !this.handle || this._meta.originalHash !== hash(this);
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
