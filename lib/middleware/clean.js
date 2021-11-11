var SessionStore = require('../store/session');


module.exports = function(options) {
  options = options || {};
  
  var store = options.store || new SessionStore(options);
  
  var ttl = options.ttl || undefined;
  var limit = options.limit || undefined;
  
  
  return function clean(req, res, next) {
    
    store.all(req, function(err, states) {
      if (err) { return next(err); }
      if (!states) { return next(); }
      
      var evict = 0;
      if (limit) { evict = states.length - limit; }
      
      var sorted = states.sort(function(s1, s2) {
        return s1.expires - s2.expires;
      });
      
      var state
        , i = 0;
      (function iter(err) {
        if (err) { return next(err); }
        
        state = sorted[i++];
        if (!state) { return next(); } // done
        
        var ttl = state.expires.valueOf() - Date.now();
        if (ttl <= 0 || evict-- > 0) {
          store.destroy(req, state.handle, iter);
        } else {
          iter();
        }
      })();
    });
  };
};
