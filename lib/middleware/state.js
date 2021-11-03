var uri = require('url')
  , State = require('../state')
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

/**
 * Load state.
 *
 * This middleware is used to load state associated with a request.  The state
 * will be made available at `req.state`.
 *
 * HTTP is a stateless protocol.  In order to support stateful interactions, the
 * client and server need to operate in coordination.  The server is responsible
 * for persisting state associated with a request.  The client is responsible for
 * indicating that state in subsequent requests to the server (via a `state`
 * parameter in the query or body, by default).  The server then loads the
 * previously persisted state in order to continue processing the transaction.
 *
 * Options:
 *
 *     name   set req.state only if the state name is equal to the option value
 *     required   require state, failing otherwise (default: false)
 *
 * Examples:
 *
 *     app.get('/login',
 *       flowstate.loadState(),
 *       function(req, res, next) {
 *         res.locals.failureCount = req.state.failureCount;
 *         res.render('login');
 *       });
 *
 *     app.get('/login/callback',
 *       flowstate.loadState({ name: 'oauth2-redirect', required: true }),
 *       function(req, res, next) {
 *         // ...
 *       });
 *
 * @return {Function}
 * @api public
 */
module.exports = function(options) {
  options = options || {}
  
  var store = options.store || new SessionStore(options);
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  // WIP: On state init, set `resume` if the state is not intended for this lcoation
  
  
  // TODO: add a "locations" option, with relative paths that will be added to location
  
  
  return function state(req, res, next) {
    // self-awareness
    if (req.state) { return next(); }
    
    // expose store
    req.stateStore = store;
    
    res.pushState = function(state, url, end) {
      end = end !== undefined ? end : true;
      
      // WIP: Test case where this is a relative URL
      state.location = uri.resolve(utils.originalURL(req), url);
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
        this.redirect(req.state.returnTo);
      } else if (req.state.state) {
        var self = this;
        
        req.state.destroy(function(err) {
          if (err) { return cb(err); }
          
          store.load(req, req.state.state, function(err, data) {
            if (err) { return cb(err); }
          
            // WIP: Need a state stack to traverse to do destroy on res.render/res.redirect
          
            var state = new State(req, data, req.state.state);
            merge(state, yields);
            
            // TODO: This can be short-circuited to alway save, and optimize in there
            if (!state.isModified()) {
              self.redirect(data.location + '?state=' + state.handle);
            } else {
              state.save(function(err) {
                if (err) { return cb(err); }
                self.redirect(state.location + '?state=' + state.handle);
              });
            }
          });
        });
      } else {
        cb();
      }
    }
    
    // swizzle redirect to commit the state
    swizzleRedirect(res, function commitState(url, cb) {
      debug('redirect %s, %O (handle: %s, modified: %o, saved: %o, complete: %o, new: %o)', url, req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved(), req.state.isComplete(), req.state.isNew());
      
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
        req.state.save(function(err) {
          if (err) { return next(err); } // FIXME: This should call cb?
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
    
    var data = {
      returnTo: (req.query && req.query.return_to) || (req.body && req.body.return_to) || (req.header ? req.header('referer') : undefined)
    }
    if (options.continue) {
      data.location = uri.resolve(utils.originalURL(req), options.continue);
    }
    // TODO: Test case for initialized state without a location that is then saved.  is location added?
    
    
    // TODO: Should returnTo be defaulted to current URL over referrer?
    //if (!req.state.returnTo && !req.state.state && !req.yieldState)  { req.state.returnTo = req.originalUrl || req.url; }
    
    // TODO: Might want to use a default URL passed as option in this case?
    //if (data.returnTo == utils.originalURL(req)) {
      // TODO: Maybe we do want to return to same resource?  POST to create, and then view?
      // Don't return to same resource
      //delete data.returnTo;
    //}
    
    // TODO: test case for originalUrl
    req.state = new State(req, data, undefined);
    // TODO: Delete this line once tests are fixed
    if (req.state.returnTo === undefined) { delete req.state.returnTo; }
    
    // swizzle render to commit the state
    swizzleRender(res, function commitState(cb) {
      debug('render %O (handle: %s, modified: %o, saved: %o, complete: %o)', req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved(), req.state.isComplete());
      
      // FIXME: Only get this from state, as in the isComplete case below
      //        as in the isNew case below.  this whole conditional block can be cleaned up
      var returnTo = (req.query && req.query.return_to) || (req.body && req.body.return_to);
      if (returnTo) {
        res.locals.returnTo = returnTo;
      }
      
      var qstate = (req.query && req.query.state) || (req.body && req.body.state);
      
      if (req.state.isComplete()) {
        cb();
      } else if (req.state.isModified()) {
        req.state.save(function(err) {
          if (err) { return next(err); } // FIXME: This should call cb?
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
    
    if (options.external) { return next(); }
    
    var h = getHandle(req);
    if (!h) { return next(); }
    
    store.load(req, h, function(err, state) {
      if (err) { return next(err); }
      if (!state) { return next(); }
      
      if (state.location !== utils.originalURLWithoutQuery(req)) {
        req.state = new State(req, { state: h });
      } else {
        req.state = new State(req, state, h);
      }
      next();
    });
  };
};
