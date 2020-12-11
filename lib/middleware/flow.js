var uri = require('url')
  , State = require('../state')
  , loadState = require('./load')
  , finishState = require('./complete')
  , failState = require('./completeError')
  , returnStateMw = require('./return')
  , dispatch = require('../utils').dispatch
  , swizzleRedirect = require('../utils/swizzle-redirect')
  , swizzleRender = require('../utils/swizzle-render')
  , swizzleEnd = require('../utils/swizzle-end')
  , flatten = require('utils-flatten')
  , merge = require('utils-merge')
  , debug = require('debug')('flowstate');

  // TIPS: Generally, push a state before redirecting (unless wizard style
  //  alternatively, handler can lazily push, for its own state, to preserve storage
  //  which could be done based on the presence of a returnTo (which is not the handlers URL)

module.exports = function(dispatcher, store, _rest) {
  var options = {}
    , completeState, completeErrorState, returnState;
  
  var _si = 2;
  
  var fns = Array.prototype.slice.call(arguments, _si);
  if (typeof fns[fns.length - 1] == 'object' && !Array.isArray(fns[fns.length - 1])) {
    options = fns.pop();
  }
  
  var postFns;
  if (Array.isArray(fns[fns.length - 1])) {
    postFns = fns.pop();
  }
  fns = flatten(fns);
  options.postFns = postFns && flatten(postFns);
  
  var actionMethods = options.actionMethods;
  
  //options.name = name;
  // TODO: Default `name` to req.path
  // set it on `req.stateName`, and check things there
  
  if (options.external) {
    fns.unshift(initialize);
  } else {
    fns.unshift(loadState(store, options));
    fns.unshift(initialize);
  }
  
  completeState = finishState(dispatcher, options);
  completeErrorState = failState(dispatcher, options);
  returnState = returnStateMw(dispatcher, options);
  
  fns.push(completeState);
  fns.push(returnState);
  fns.push(completeErrorState);
  
  //console.log('STACK IS:');
  //console.log(fns);
  
  
  
  function initialize(req, res, next) {
    console.log('!!!FLOWING!!!');
    
    // self-awareness
    if (req.state) {
      next();
      return;
    }
    
    // expose store
    req.stateStore = store;
    
    var data = {
      returnTo: (req.query && req.query.return_to) || (req.header ? req.header('referer') : undefined)
    }
    
    // TODO: test case for originalUrl
    req.state = new State(req, data, undefined, options.external);
    // TODO: Delete this line once tests are fixed
    if (req.state.returnTo === undefined) { delete req.state.returnTo; }
    
    
    res.pushState = function(state, url, end) {
      end = end !== undefined ? end : true;
      
      if (url) { state.location = url; }
      req.state.push(state);
      end && this.redirect(url);
    }
    
    res.popState = function(yields, cb) {
      req.state.complete();
      
      if (req.state.returnTo) {
        this.redirect(req.state.returnTo);
      } else if (req.state.resume) {
        var self = this;
        
        req.state.destroy(function(err) {
          //if (err) { return next(err); }
          //return proceed(state.state, state);
          //cb();
          
          store.load(req, req.state.resume, function(err, data) {
            if (err) { return next(err); }
          
            console.log('DATA IS');
            console.log(data);
            console.log('STATE IS');
            console.log(state);
          
            // WIP: Need a state stack to traverse to do destroy on res.render/res.redirect
          
            var state = new State(req, data, req.state.resume);
            merge(state, yields);
            
            if (!state.isModified()) {
              console.log('IT WAS MODIFIED!');
              
              self.redirect(data.location + '?state=' + req.state.resume);
            } else {
              state.save(function(err) {
                if (err) { return cb(err); }
                
                console.log('SAVED IT!');
                self.redirect(state.location + '?state=' + state.handle);
              })
            }
          
            //req.state = new State(req, data, req.state.resume);
            //merge(req.state, state);
          
            // TODO: Need to save this after merging
          
            //console.log(req.state)
          
            // TODO: Better query serialization
            //self.redirect(data.location + '?state=' + req.state.resume);
          });
          
        });
      }
    }
    
    // swizzle redirect to commit the state
    swizzleRedirect(res, function commitState(url, cb) {
      debug('redirect %s, %O (handle: %s, modified: %o, saved: %o, complete: %o, external: %o, new: %o)', url, req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved(), req.state.isComplete(), req.state.isExternal(), req.state.isNew());
      
      var qstate = (req.query && req.query.state) || (req.body && req.body.state);
      
      function proceed(h) {
        if (!h) {
          // orig
          //return cb();
          
          // FIXME: hack to set return_to param
          if (req.state.isTouched()) {
            var loc = uri.parse(url, true);
            delete loc.search;
          
            // FIXME: clean up the return_to processing, for only states that are unmodified
            loc.query.return_to = req.originalUrl || req.url;
          
            return cb(null, uri.format(loc));
          }
          
          return cb();
        }
        
        var loc = uri.parse(url, true);
        delete loc.search;
        loc.query.state = h;
        
        cb(null, uri.format(loc));
      }
      
      if (req.state.isComplete()) {
        proceed();
      } else if ((req.state.isNew() && req.state.isTouched()) || req.state.isModified() || req.state.isExternal()) {
        // FIXME: only do this if state is incomplete?
        // TODO: Eliminate this defaulting of returnTo here, not sure what its doing
        if (!req.state.returnTo && !req.state.resume && !req.yieldState)  { req.state.returnTo = req.originalUrl || req.url; }
        if (req.state.isExternal() && options.continue) {
          req.state.returnTo = options.continue;
        }
        
        req.state.save(function(err) {
          // TODO: error handling
          debug('set `state` query parameter to saved state (%s)', req.state.handle);
          proceed(req.state.handle);
        });
      } else if (req.state.isNew()) {
        if (req.state.state) {
          debug('set `state` query parameter to parent state (%s)', req.state.state);
          proceed(req.state.state);
        } else {
          debug('set `state` query parameter to query state (%s)', qstate);
          proceed(qstate);
        }
      } else { // current state
        debug('set `state` query parameter to current state (%s)', req.state.handle);
        proceed(req.state.handle);
      }
    });
    
    // swizzle render to commit the state
    swizzleRender(res, function commitState(cb) {
      debug('render %O (handle: %s, modified: %o, saved: %o, complete: %o, external: %o)', req.state,
        req.state.handle, req.state.isModified(), req.state.isSaved(), req.state.isComplete(), req.state.isExternal());
      
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
    
    console.log('#INEXT');
    next();
  };
  
  return fns;
};
