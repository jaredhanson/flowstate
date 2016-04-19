var SessionStore = require('../stores/session');


module.exports = function(options) {
  options = options || {};
  
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  var store = options.store || new SessionStore();
  
  
  return function loadState(req, res, next) {
    var h = getHandle(req);
    if (!h) { return next(); }
    
    store.load(req, h, function (err, state) {
      if (err) { return next(err); }
      req.state = state;
      next();
    });
  };
};
