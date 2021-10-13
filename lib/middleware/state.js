var uri = require('url')
  , State = require('../state')
  , loadState = require('./load')
  , dispatch = require('../utils').dispatch
  , swizzleRedirect = require('../utils/swizzle-redirect')
  , swizzleRender = require('../utils/swizzle-render')
  , swizzleEnd = require('../utils/swizzle-end')
  , flatten = require('utils-flatten')
  , merge = require('utils-merge')
  , utils = require('../utils')
  , debug = require('debug')('flowstate')
  , SessionStore = require('../stores/session');

  // TIPS: Generally, push a state before redirecting (unless wizard style
  //  alternatively, handler can lazily push, for its own state, to preserve storage
  //  which could be done based on the presence of a returnTo (which is not the handlers URL)

module.exports = function(options) {
  options = options || {}
  
  var store = options.store || new SessionStore(options);
  
  // WIP: On state init, set `resume` if the state is not intended for this lcoation
  
  var _si = 2;
  
  var fns = [];
  
  if (options.external) {
    fns.unshift(initialize);
  } else {
    fns.unshift(loadState(store, options));
    fns.unshift(initialize);
  }
  
  
  // TODO: add a "locations" option, with relative paths that will be added to location
  
  
  function initialize(req, res, next) {
    // self-awareness
    if (req.state) {
      next();
      return;
    }
    
    // expose store
    req.stateStore = store;
    
    var data = {
      returnTo: (req.query && req.query.return_to) || (req.body && req.body.return_to) || (req.header ? req.header('referer') : undefined)
    }
    if (data.returnTo == utils.originalURL(req)) {
      // TODO: Maybe we do want to return to same resource?  POST to create, and then view?
      // Don't return to same resource
      delete data.returnTo;
    }
    
    // TODO: test case for originalUrl
    req.state = new State(req, data, undefined, options.external);
    // TODO: Delete this line once tests are fixed
    if (req.state.returnTo === undefined) { delete req.state.returnTo; }
    
    
    res.pushState = function(state, url, end) {
      end = end !== undefined ? end : true;
      
      // WIP: Test case where this is a relative URL
      if (url) { state.location = uri.resolve(utils.originalURL(req), url); }
      req.state.push(state);
      end && this.redirect(url);
    }
    
    res.resumeState = function(yields, cb) {
      if (typeof yields == 'function') {
        cb = yields;
        yields = undefined;
      }
      
      req.state.complete();
      
      if (req.state.returnTo) {
        if (!yields) {
          this.redirect(req.state.returnTo);
        } else {
          var state = new State(req, yields);
          state.location = req.state.returnTo;
          var self = this;
          
          state.save(function(err) {
            if (err) { return cb(err); }
            self.redirect(req.state.returnTo + '?state=' + state.handle);
          })
        }
      } else if (req.state.state) {
        var self = this;
        
        req.state.destroy(function(err) {
          //if (err) { return next(err); }
          //return proceed(state.state, state);
          //cb();
          
          store.load(req, req.state.state, function(err, data) {
            if (err) { return next(err); }
          
            // WIP: Need a state stack to traverse to do destroy on res.render/res.redirect
          
            var state = new State(req, data, req.state.state);
            merge(state, yields);
            
            if (!state.isModified()) {
              self.redirect(data.location + '?state=' + req.state.state);
            } else {
              state.save(function(err) {
                if (err) { return cb(err); }
                self.redirect(state.location + '?state=' + state.handle);
              })
            }
          
            //req.state = new State(req, data, req.state.resume);
            //merge(req.state, state);
          
            // TODO: Need to save this after merging
          
            // TODO: Better query serialization
            //self.redirect(data.location + '?state=' + req.state.resume);
          });
          
        });
      } else {
        cb();
      }
    }
    
    // swizzle redirect to commit the state
    swizzleRedirect(res, function commitState(url, cb) {
      debug('redirect %s, %O (handle: %s, modified: %o, saved: %o, complete: %o, external: %o, new: %o)', url, req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved(), req.state.isComplete(), req.state.isExternal(), req.state.isNew());
      
      var qstate = (req.query && req.query.state) || (req.body && req.body.state);
      
      function proceed(v) {
        if (!v) { return cb(); }
        
        // Add `state` as a query parameter to the URL that the user agent is
        // being redirected to.
        var l = uri.parse(url, true);
        delete l.search;
        l.query.state = v;
        return cb(null, uri.format(l));
      }
      
      if (req.state.isComplete()) {
        proceed();
      } else if (req.state.isModified()) {
        // FIXME: only do this if state is incomplete?
        // TODO: Eliminate this defaulting of returnTo here, not sure what its doing
        if (!req.state.returnTo && !req.state.state && !req.yieldState)  { req.state.returnTo = req.originalUrl || req.url; }
        if (req.state.isExternal() && options.continue) {
          req.state.location = uri.resolve(utils.originalURL(req), options.continue);
          // FIXME: Don't set returnTO in this case, wherever it is set initially.  Find that and fix it there.
          delete req.state.returnTo;
        }
        
        req.state.save(function(err) {
          if (err) { return next(err); }
          debug('set `state` query parameter to saved state (%s)', req.state.handle);
          proceed(req.state.handle);
        });
      } else if (req.state.isNew()) {
        // newly initialized state, without any state to actually track.  Just pass on
        // the parent state.
        proceed(req.state.state);
      } else { // current state
        debug('set `state` query parameter to current state (%s)', req.state.handle);
        proceed(req.state.handle);
      }
    });
    
    // swizzle render to commit the state
    swizzleRender(res, function commitState(cb) {
      debug('render %O (handle: %s, modified: %o, saved: %o, complete: %o, external: %o)', req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved(), req.state.isComplete(), req.state.isExternal());
      
      // FIXME: Only get this from state, as in the isComplete case below
      //        as in the isNew case below.  this whole conditional block can be cleaned up
      var returnTo = (req.query && req.query.return_to) || (req.body && req.body.return_to);
      if (returnTo) {
        res.locals.returnTo = returnTo;
      }
      
      var qstate = (req.query && req.query.state) || (req.body && req.body.state);
      
      if (req.state.isComplete()) {
        cb();
      } else if ((req.state.isNew() && req.state.isTouched()) || req.state.isModified() || req.state.isExternal()) {
        req.state.save(function(err) {
          // TODO: error handling
          debug('set `res.locals.state` to saved state (%s)', req.state.handle);
          res.locals.state = req.state.handle;
          cb();
        });
      } else if (req.state.isNew()) {
        if (req.state.state) {
          debug('set `res.locals.state` to parent state (%s)', req.state.state);
          res.locals.state = req.state.state;
        } else if (qstate) {
          debug('set `res.locals.state` to query state (%s)', qstate);
          res.locals.state = qstate;
        }
        if (req.state.returnTo) { res.locals.returnTo = req.state.returnTo; }
        cb();
      } else { // current state
        debug('set `res.locals.state` to current state (%s)', req.state.handle);
        res.locals.state = req.state.handle;
        cb();
      }
    });
    
    swizzleEnd(res, function autoDestroy(cb) {
      debug('end %O (handle: %s, complete: %o)', req.state,
        req.state.handle, req.state.isComplete());
      
      // WIP: figure out how to maintain incomplete states
      // probably best to mandate external states be  flagged complete ??
      
      // TODO: also check fo unchanged?
      //if (!req.state.isNew()) {
      if (req.state.isComplete()) {
        debug('destroying complete state (%s)', req.state.handle);
        req.state.destroy(function(err) {
          //if (err) { return next(err); }
          //return proceed(state.state, state);
          cb();
        });
      } else {
        cb();
      }
    });
    
    next();
  };
  
  return fns;
};
