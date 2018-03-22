var Meta = require('./meta')
  , crc = require('crc').crc32;


function State(req, data) {
  Object.defineProperty(this, 'req', { value: req });
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
