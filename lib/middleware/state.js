// Module dependencies.
var uri = require('url')
  , State = require('../state')
  , swizzleRedirect = require('../utils/swizzle-redirect')
  , swizzleRender = require('../utils/swizzle-render')
  , swizzleEnd = require('../utils/swizzle-end')
  , merge = require('utils-merge')
  , utils = require('../utils')
  , validate = require('../validate')
  , debug = require('debug')('flowstate')
  , SessionStore = require('../store/session');

var uid = require('uid2');

/**
 * Server resonse..
 *
 * @class
 * @name ServerResponse
 */


  // TIPS: Generally, push a state before redirecting (unless wizard style
  //  alternatively, handler can lazily push, for its own state, to preserve storage
  //  which could be done based on the presence of a returnTo (which is not the handlers URL)

/**
 * Create state middleware with the given `options`.
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
 * @public
 * @name module:flowstate
 * @param {Object} [options]
 * @return {function}
 */
module.exports = function(options) {
  options = options || {}
  
  var store = options.store || new SessionStore(options);
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  var validateRedirect = validate.origin;
  var generateHandle = options.genh || function() { return uid(8); }
  
  var mutationMethods = options.mutationMethods === undefined
    ? ['POST', 'PUT', 'PATCH', 'DELETE']
    : options.mutationMethods;
  
  return function state(req, res, next) {
    // self-awareness
    if (req.state) { return next(); }
    
    // expose store
    req.stateStore = store;
    
    /**
     * Add state to be made available on a request for `url`.
     *
     * @public
     * @name ServerResponse#pushState
     * @function
     * @param {object} data
     * @param {string} url
     */
    req.pushState = function(data, url, options, cb) {
      if (typeof options == 'function') {
        cb = options;
        options = undefined;
      }
      options = options || {};
      
      // TODO: only support handle as option?
      
      data.location = uri.resolve(utils.originalURL(req), url);
      if (req.state.returnTo && !req.state.external) {
        data.returnTo = req.state.returnTo;
      } else if (req.state.resumeState) {
        data.resumeState = req.state.resumeState;
      }
      
      var state = new State(req, data);
      req._stateStack.push(state);
      
      if (cb) {
        if (typeof store.set == 'function') { state.handle = options.handle || generateHandle(); }
        state.save(options, function(err) {
          if (err) { return cb(err); }
          return cb(null, state.handle);
        });
      }
    }
    
    /**
     * Remove a previously added, but uncommited, state.
     *
     * @public
     * @name ServerResponse#popState
     * @function
     */
    req.popState = function() {
      if (req._stateStack.length == 1) { return; } // don't pop current state
      return req._stateStack.pop();
    }
    
    /**
     * Resume prior state, if any, by redirecting its URL.
     *
     * @public
     * @name ServerResponse#resumeState
     * @function
     * @param {object} [yields]
     */
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
          if (err) { return cb(err); }
          
          var state = new State(req, data, req.state.resumeState);
          merge(state, yields);
          req._stateStack.push(state);
          self.redirect(state.location);
        });
      } else {
        cb();
      }
    }
    
    /**
     * Redirect to the given `url` with optional response `status` defaulting to
     * 302.
     *
     * This function calls {@link https://expressjs.com/en/4x/api.html#res.redirect `redirect`},
     * which is enhanced by {@link https://expressjs.com/ Express} on {@link https://nodejs.org/ Node.js}'s
     * {@link https://nodejs.org/api/http.html#http_class_http_serverresponse `http.ServerResponse`}.
     *
     * Prior to redirecting, any uncommited state is commited.  Either a
     * `return_to` or `state` query parameter will be added to the given `url`
     * to represent the state.  The state is then available to the ensuing
     * request to `url`.
     *
     * @public
     * @name ServerResponse#redirect
     * @function
     * @param {number} [status=302]
     * @param {string} url
     */
    
    // swizzle redirect to commit the state
    swizzleRedirect(res, function(url, cb) {
      if ((mutationMethods.indexOf(req.method) != -1) && !req.state.isModified()) {
        req.state.complete();
      }
      
      commit(function(err, returnTo, state) {
        if (err) { return next(err); }
        
        if (!returnTo && !state) { return cb(); }
        var l = uri.parse(url, true);
        delete l.search;
        if (returnTo) { l.query.return_to = returnTo; }
        else if (state) { l.query.state = state; }
        return cb(null, uri.format(l));
      });
    });
    
    /**
     * Render `view` with the given `options` and optional `callback`.  When a
     * callback function is given a response will _not_ be made automatically,
     * otherwise a response of _200_ and _text/html_ is given.
     *
     * This function calls {@link https://expressjs.com/en/4x/api.html#res.render `render`},
     * which is enhanced by {@link https://expressjs.com/ Express} on {@link https://nodejs.org/ Node.js}'s
     * {@link https://nodejs.org/api/http.html#http_class_http_serverresponse `http.ServerResponse`}.
     *
     * Prior to redirecting, any uncommited state is commited.  Either a
     * `return_to` or `state` variable will be set on {@link https://expressjs.com/en/4x/api.html#res.locals locals}
     * to represent the state.  The view can then make the state available to
     * subsequent requests initiated via links, forms, or other methods.
     *
     * @public
     * @name ServerResponse#render
     * @function
     * @param {string} view
     * @param {object} [options]
     * @param {function} [callback]
     */
    
    // swizzle render to commit the state
    swizzleRender(res, function(cb) {
      // TODO: dont' complete the state if it is flagged to continue
      if ((mutationMethods.indexOf(req.method) != -1) && (Math.floor(res.statusCode / 100) == 2)) {
        req.state.complete();
      }
      
      commit(function(err, returnTo, state) {
        if (err) { return next(err); } // FIXME: This should call cb?
        
        if (returnTo) { res.locals.returnTo = returnTo; }
        else if (state) { res.locals.state = state; }
        cb();
      });
    });
    
    swizzleEnd(res, function(cb) {
      commit(function() {
        cb();
      });
    });
    
    
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
        if (err) { return cb(err); } // TODO: Test case for this
      
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
          if (!state.handle && (typeof store.set == 'function')) {
            state.handle = generateHandle();
          }
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
