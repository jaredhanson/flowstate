var SessionStore = require('../store/session');


module.exports = function(store, options) {
  options = options || {};
  
  var store = options.store || new SessionStore(options);
  
  var ttl = options.ttl || undefined;
  var limit = options.limit || undefined;
  
  
  return function clean(req, res, next) {
    store.all(req, function(err, states) {
      if (err) { return next(err); }
      if (!states) { return next(); }
      
      var sorted = states.sort(function(s1, s2) {
        return s1.initiatedAt - s2.initiatedAt;
      });
      
      var state
        , i = 0;
      
      (function iter(err) {
        if (err) { return next(err); }
        
        state = states[i++];
        if (!state) { return next(); } // done
        
        
        var age = Date.now() - state.initiatedAt;
        
        if (limit && (states.length - i) >= limit) {
          store.destroy(req, state.handle, iter);
        } else if (ttl && age > ttl) {
          store.expire(req, state.handle, iter);
        } else {
          iter();
        }
      })();
    });
  };
};
