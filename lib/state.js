function State(req, data) {
  Object.defineProperty(this, 'req', { value: req });
  
  if (typeof data === 'object' && data !== null) {
    // merge data into this, ignoring prototype properties
    for (var prop in data) {
      if (!(prop in this)) {
        this[prop] = data[prop];
      }
    }
  }
}


module.exports = State;
