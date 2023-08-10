var SessionStore = require('../store/session');


module.exports = function(options) {
  options = options || {};
  
  var store = options.store || new SessionStore(options);
  var limit = options.limit || undefined;
  
  return function clean(req, res, next) {
    store.all(req, function(err, states) {
      if (err) { return next(err); }
      if (!states) { return next(); }
      
      // TODO: clean this up
      states.forEach(function(state) {
        if (typeof state.expires === 'string') {
          // convert expires to a Date object
          state.expires = new Date(state.expires);
        }
      })
      
      var evict = 0;
      if (limit) { evict = states.length - limit; }
      
      var sorted = states.sort(function(s1, s2) {
        if (s1.expires && !s2.expires) { return -1; }
        if (!s1.expires && !s2.expires) { return 0; }
        if (!s1.expires && s2.expires) { return 1; }
        return s1.expires.valueOf() - s2.expires.valueOf();
      });
      
      var state
        , i = 0;
      (function iter(err) {
        if (err) { return next(err); }
        
        state = sorted[i++];
        if (!state) { return next(); } // done
        
        var ttl = state.expires ? state.expires.valueOf() - Date.now() : 1;
        if (ttl <= 0 || evict-- > 0) {
          store.destroy(req, state.handle, iter);
        } else {
          iter();
        }
      })();
    });
  };
};
