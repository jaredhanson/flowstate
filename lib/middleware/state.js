var uri = require('url')
  , State = require('../state')
  , swizzleRedirect = require('../utils/swizzle-redirect')
  , swizzleRender = require('../utils/swizzle-render')
  , swizzleEnd = require('../utils/swizzle-end')
  , flatten = require('utils-flatten')
  , merge = require('utils-merge')
  , utils = require('../utils')
  , validate = require('../validate')
  , debug = require('debug')('flowstate')
  , SessionStore = require('../store/session');

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
  var validateRedirect = validate.origin;
  
  var mutationMethods = options.mutationMethods === undefined
    ? ['POST', 'PUT', 'PATCH', 'DELETE']
    : options.mutationMethods
  
  return function state(req, res, next) {
    // self-awareness
    if (req.state) { return next(); }
    
    // expose store
    req.stateStore = store;
    
    req.pushState = function(data, url, options, cb) {
      if (typeof options == 'function') {
        cb = options;
        options = undefined;
      }
      options = options || {};
      
      data.location = uri.resolve(utils.originalURL(req), url);
      if (req.state.returnTo && !req.state.external) {
        data.returnTo = req.state.returnTo;
      } else if (req.state.resumeState) {
        data.resumeState = req.state.resumeState;
      }
      
      var state = new State(req, data);
      req._stateStack.push(state);
      req.state = state;
      
      if (cb) {
        state.save(options, function(err) {
          if (err) { return cb(err); }
          return cb(null, state.handle);
        });
      }
    }
    
    res.resumeState = function(yields, cb) {
      if (typeof yields == 'function') {
        cb = yields;
        yields = undefined;
      }
      
      req.state.complete();
      
      if (req.state.returnTo) {
        // TODO: underscore the parameters, adn redirect with query
        this.redirect(req.state.returnTo);
      } else if (req.state.resumeState) {
        var self = this;
        store.get(req, req.state.resumeState, function(err, data) {
          if (err) { return cb(err); }  // FIXME: this should be next?
          
          var state = new State(req, data, req.state.resumeState);
          merge(state, yields);
          req._stateStack.push(state);
          self.redirect(state.location);
        });
      } else {
        cb();
      }
    }
    
    // swizzle redirect to commit the state
    swizzleRedirect(res, function(url, cb) {
      if ((mutationMethods.indexOf(req.method) != -1) && !req.state.isModified()) {
        req.state.complete();
      }
      
      commit(function(err, returnTo, state) {
        if (err) { return next(err); } // FIXME: This should call cb? No
        
        if (!returnTo && !state) { return cb(); }
        var l = uri.parse(url, true);
        delete l.search;
        if (returnTo) { l.query.return_to = returnTo; }
        else if (state) { l.query.state = state; }
        return cb(null, uri.format(l));
      });
    });
    
    // swizzle render to commit the state
    swizzleRender(res, function commitState(cb) {
      
      
      // TODO: generalize this and make it an option, like csurf
      // TODO: dont' complete the state if it is flagged to continue
      
      // TODO: Shouldn't do this if done after resumeState.
      //.      swizzle it back to orig
      if (mutationMethods.indexOf(req.method) != -1) {
        if (Math.floor(res.statusCode / 100) == 2) {
          req.state.complete();
        }
      }
      
      
      commit(function(err, returnTo, state) {
        if (err) { return next(err); } // FIXME: This should call cb?
        
        if (returnTo) { res.locals.returnTo = returnTo; }
        else if (state) { res.locals.state = state; }
        cb();
      });
    });
    
    swizzleEnd(res, function autoDestroy(cb) {
      // WIP: figure out how to maintain incomplete states
      // probably best to mandate external states be  flagged complete ??
      
      commit(function() {
        cb();
      });
    });
    
    
    // WIP: More code review.  Put the stack in place and clean up on res.end.
    
    function generate() {
      var data = {
        location: utils.originalURLWithoutQuery(req)
      };
      
      var returnTo = (options.external ? utils.originalURL(req) : undefined)
        || (req.query && req.query.return_to)
        || (req.body && req.body.return_to)
        || (req.header ? req.header('referer') : undefined);
      if (returnTo) {
        var valid = validateRedirect(returnTo, req);
        if (valid) {
          data.returnTo = returnTo;
        }
      }
      
      req.state = new State(req, data, undefined, options.external);
      req._stateStack = [ req.state ];
    }
    
    function inflate(state, h) {
      req.state = new State(req, state, h);
      req._stateStack = [ req.state ];
    }
    
    function commit(cb) {
      var stack = req._stateStack
        , i = 0;
    
      function iter(err, returnTo, resumeState) {
        if (err) { return next(err); } // TODO: Test case for this
      
        var state = stack[i++];
        if (!state) { return cb(null, returnTo, resumeState); }
      
        if (state.isComplete()) {
          debug('destroying %O (%s)', state, state.handle);
          state.destroy(function(err) {
            if (err) { return iter(err); }
            debug('destroyed');
            iter(null, undefined, state.resumeState);
          });
        } else if (state.isModified() || (i > 1 && !state.isSaved())) {
          debug('saving %O (%s)', state, state.handle);
          state.save(function(err) {
            if (err) { return iter(err); }
            debug('saved (%s)', state.handle);
            iter(null, undefined, state.handle);
          });
        } else if (state.isNew()) {
          iter(null, state.returnTo, state.resumeState);
        } else { // current
          iter(null, undefined, state.handle);
        }
      }
      iter();
    }
    
    
    // Initialize a state if the browser didn't send a state handle, or the
    // endpoint indicated that state, if any, is external to this app.
    //
    // The latter case is common with federated protocols, such as OpenID
    // Connect and OAuth 2.0, in which clients make requests that initiate
    // stateful transactions within the app making use of this middleware.
    // These requests may have a `state` parameter, but its value is meant to be
    // included when the browser is redirected back to the client so the client
    // can maintain its state.
    var h = getHandle(req);
    if (!h || options.external) {
      generate();
      next();
      return;
    }
    
    store.get(req, h, function(err, state) {
      if (err) { return next(err); }
      
      if (!state) {
        generate();
        next();
        return;
      }
      
      var url = utils.originalURLWithoutQuery(req);
      if (state.location !== url) {
        // The referened state is not intended for the endpoint that was
        // requested.
        //
        // A new state will be initialized which, when complete, will trigger
        // the referenced state to resume.  This process is managed by building
        // a logical stack of states as the browser is redirected or navigated
        // to a series of pages, where a reference to the current state is
        // relayed with each request.  Once a request is processed which does
        // not result in a further redirect, the stack unwinds by popping the
        // state to be resumed.
        inflate({ location: url, resumeState: h });
      } else {
        inflate(state, h);
      }
      
      next();
    });
  };
};
