var SessionStore = require('../stores/session');


module.exports = function(store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  var name = options.name;
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  return function loadState(req, res, next) {
    var h = getHandle(req);
    if (!h) { return next(); }
    
    store.load(req, h, function (err, state) {
      if (err) { return next(err); }
      if (!name) {
        req.state = state;
      } else if (name == state.name) {
        req.state = state;
      } else {
        // The loaded state is not the requested state.  Save what was loaded,
        // as an optimization to avoid re-loading later if the state is resumed.
        req._state = state;
      }
      next();
    });
  };
};
