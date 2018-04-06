var uri = require('url')
  , loadState = require('./load')
  , finishState = require('./complete')
  , failState = require('./completeError')
  , swizzleRedirect = require('../utils/swizzle-redirect')
  , onRender = require('../utils/on-render')
  , onEnd = require('../utils/on-end')
  , State = require('../state')
  , crc = require('crc').crc32
  , debug = require('debug')('flowstate');




module.exports = function(dispatcher, store, name, _rest) {
  var options = {}
    , completeState, completeErrorState;
  
  var fns = Array.prototype.slice.call(arguments, 3);
  if (typeof fns[fns.length - 1] == 'object') {
    options = fns.pop();
  }
  options.name = name;
  // TODO: Default `name` to req.path
  // set it on `req.stateName`, and check things there
  
  if (options.external) {
    fns.unshift(initialize);
  } else {
    completeState = finishState(dispatcher, store, options);
    completeErrorState = failState(dispatcher, store, options);
    
    fns.unshift(loadState(store, options));
    fns.unshift(initialize);
    fns.push(completeState);
    fns.push(completeErrorState);
  }
  
  
  
  
  function initialize(req, res, next) {
    // self-awareness
    if (req.state) {
      next();
      return;
    }
    
    // expose store
    req.stateStore = store;
    
    req.state = new State(req, { name: name });
    
    
    /**
     * Trigger the prompt specified by `name`, with optional `options`.
     *
     * A flow can trigger a prompt, which will interact with the user.  For
     * example, a login flow might trigger multi-factor authentication in order
     * to step up the authentication to a higher degree of confidence.
     *
     * When triggered, the `begin` phase of the specified prompt will be
     * invoked.  The begin phase will typically redirect the user to an endpoint
     * which then displays the prompt and, subsequently, processes user input.
     * In some circumstances, the prompt may render a view directly; however,
     * redirects are recommended.
     *
     * Conceptually, a prompt is its own flow and the triggering flow is the
     * parent flow.  The parent flow is a flow which may trigger zero or more
     * subflows.
     *
     * Examples:
     *
     *     res.prompt('mfa', { method: 'otp' });
     *
     * @param {String} name
     * @param {Object} options
     * @api public
     */
    res.prompt = function prompt(name, options) {
      debug('prompting %s, %O (handle: %s, modified: %o, saved: %o)', name, req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved());
      
      options = options || {};
      
      
      function proceed() {
        dispatcher.goto(name, options, req, res, function(err) {
          // TODO: Implement this
          //console.log('ERROR?')
          //console.log(err);
        });
      }
      
      if (req.state.isSaved()) {
        req.state = new State(req, { name: name, prev: req.state.handle });
        proceed();
      } else if (req.state.isNew() || req.state.isModified()) {
        req.state.save(function(err) {
          // TODO: error handling
          req.state = new State(req, { name: name, prev: req.state.handle });
          proceed();
        });
      } else {
        // TODO: set req.state here, without prev
        proceed();
      }
    };
    
    
    // swizzle redirect to commit the state
    swizzleRedirect(res, function commitState(url, cb) {
      debug('redirecting %s, %O (handle: %s, modified: %o, saved: %o)', url, req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved());
      
      
      function proceed(h) {
        if (!h) { return cb(); }
        
        var loc = uri.parse(url, true);
        delete loc.search;
        loc.query.state = h;
        cb(null, uri.format(loc));
      }
      
      
      
      if (req.state.isNew() && (req.state.isModified() || req.state.isTouched())) {
        req.state.save(function(err) {
          // TODO: error handling
          proceed(req.state.handle);
        });
      } else if (req.state.isModified()) {
        req.state.save(function(err) {
          // TODO: error handling
          proceed(req.state.handle);
        });
      } else if (req.state.isNew()) {
        console.log('RP - prev')
        return proceed(req.state.prev);
      } else {
        console.log('RP - none')
        return proceed();
      }
    });
    
    onRender(res, function autoState(cb) {
      debug('rendering %O (handle: %s, modified: %o)', req.state, req.state.handle, req.state.isModified());
      
      if (req.state.isNew() && (req.state.isModified() || req.state.isTouched())) {
        store.save(req, req.state, function(err, h) {
          res.locals.state = h;
          return cb();
        });
        return;
        
      } else if (req.state.isModified()) {
        store.update(req, req.state.handle, req.state, function(err, h) {
          res.locals.state = h;
          return cb();
        });
        return;
      } else if (req.state.isNew()) {
        if ((req.query && req.query.state) || (req.body && req.body.state)) {
          res.locals.state = (req.query && req.query.state) || (req.body && req.body.state);
          debug('set `res.locals.state` to parent state (%s)', res.locals.state);
        }
        return cb();
      } else {
        res.locals.state = req.state.handle;
        debug('set `res.locals.state` to current state (%s)', res.locals.state);
        return cb();
      }
      
      
      
      // TODO else if if (req.state.isModified()) {
    });
    
    onEnd(res, function autoDestroy(cb) {
      debug('ending %O (complete: %o)', req.state, req.state.isComplete());
      
      // WIP: figure out how to maintain incomplete states
      // probably best to mandate external states be  flagged complete ??
      
      // TODO: also check fo unchanged?
      //if (!req.state.isNew()) {
      if (req.state.isComplete()) {
        debug('destroying complete state (%s)', req.state.handle);
        store.destroy(req, req.state.handle, function(err) {
          //if (err) { return next(err); }
          //return proceed(state.prev, state);
          cb();
        });
      } else {
        cb();
      }
    })
    
    
    next();
  };
  
  return fns;
};
