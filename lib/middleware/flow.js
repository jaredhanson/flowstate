var uri = require('url')
  , loadState = require('./load')
  , finishState = require('./complete')
  , failState = require('./completeError')
  , onRedirect = require('../utils/on-redirect')
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
    
    
    res.prompt = function prompt(name, options) {
      debug('prompting %s, %O', name, req.state);
      
      console.log('!! res.prompt: ' + name);
      console.log(req.state);
      console.log(options);
      console.log('new: ' + req.state.isNew());
      console.log('changed: ' + req.state.isModified());
      console.log('saved: ' + req.state.isSaved());
      
      options = options || {};
      
      
      function proceed() {
        console.log('GOTO: ' + name);
        console.log(options);
        
        dispatcher.goto(name, options, req, res, function(err) {
          // TODO: Implement this
          //console.log('ERROR?')
          //console.log(err);
        });
      }
      
      if (req.state.isSaved()) {
        console.log('PP - already saved')
        
        req.state = new State(req, { name: name, prev: req.state.handle });
        proceed();
      } else if (req.state.isNew()) {
        console.log('PP - save')
        
        store.save(req, req.state, function(err, h) {
          //console.log('PERSISTED STATE');
          //console.log(err)
          //console.log(h);
          //console.log(req.session.state);
          
          req.state = new State(req, { name: name, prev: h });
          //req.state.prev = h;
          //options.state = h;
      
          proceed();
        });
      } else if (req.state.isModified()) {
        console.log('PP - update')
        store.update(req, req.state.handle, req.state, function(err, h) {
          //console.log('PERSISTED STATE');
          //console.log(err)
          //console.log(h);
          //console.log(req.session.state);
          // TODO: Error
          
          req.state = new State(req, { name: name, prev: h });
        
          proceed();
        });
      } else {
        // TODO: set req.state here, without prev
        proceed();
      }
    };
    
    
    
    onRedirect(res, function autoState(url, cb) {
      console.log('!! res.redirect ^ autoState');
      console.log(url);
      console.log(req.state);
      console.log('new: ' + req.state.isNew());
      console.log('changed: ' + req.state.isModified());
      console.log('must create: ' + req.state.isRequired());
      console.log('saved: ' + req.state.isSaved());
      
      // FIXME: Can infer this by state.name == name, and `external`
      //if (req.state.isComplete()) { return cb(); }
      
      /*
      if (req.state.name === name && options.external) {
        return cb();
      }
      */
      
      function proceed(h) {
        if (!h) { return cb(); }
        
        var loc = uri.parse(url, true);
        delete loc.search;
        loc.query.state = h;
        cb(null, uri.format(loc));
      }
      
      
      
      if (req.state.isNew() && (req.state.isModified() || req.state.isRequired())) {
        console.log('RP - save')
        store.save(req, req.state, function(err, h) {
          //console.log('PERSISTED STATE');
          //console.log(err)
          //console.log(h);
          //console.log(req.session.state);
          // TODO: Error
        
          proceed(h);
        });
        // FIXME: weired render after redirect if return statement isn't here.  make a test case
        //        maybe not, this was actually just  alogging issue
        return;
      } else if (req.state.isModified()) {
        console.log('RP - update')
        store.update(req, req.state.handle, req.state, function(err, h) {
          //console.log('PERSISTED STATE');
          //console.log(err)
          //console.log(h);
          //console.log(req.session.state);
          // TODO: Error
        
          proceed(h);
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
      debug('rendering %O (new: %o, modified: %o)', req.state, req.state.isNew(), req.state.isModified());
      
      if (req.state.isNew() && (req.state.isModified() || req.state.isRequired())) {
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
