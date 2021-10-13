var State = require('./state')
  , SessionStore = require('./stores/session')
  , MissingStateError = require('./errors/missingstateerror')
  , dispatch = require('./utils').dispatch
  , dispatchReal = dispatch
  , flatten = require('utils-flatten')
  , uri = require('url')
  , debug = require('debug')('flowstate');


function Manager(options, store) {
  if (!store) { store = new SessionStore(options); }
  
  this._store = store;
}

/*
Manager.prototype._through = function(through, err, req, res, next) {
  req.yieldState = req.state;
  req.state = new State(req, { name: through }, undefined, false, true);
  return this._dispatch(null, err, req, res, next);
}
*/

// TODO: clean up these arguments, in particular ystate being last
Manager.prototype._dispatch = function(options, err, req, res, next, ystate) {
  // NEW yieldstate return to option.
  //var through = options ? options.through : null;
  
  // dead code, can be deleted
  /*
  if (through && through !== req.state.name) {
    req._state = req.state;
    req.state = new State(req, { name: through }, undefined, false, true);
    req.state.state = req._state.handle;
    return this._dispatch(null, err, req, res, next);
  }
  */
  
  debug('resume %O (handle: %s) yielding %O', req.state, req.state.handle, req.yieldState);
  
  var self = this;
  
  function cont(err) {
    // TODO: Test case for transition error
    self._continue(err, req, res, next, ystate);
  }

  // TODO: Make sure transition errors get plumbed through correctly
  //this._yield(options, err, req, res, cont);
  cont();
}

Manager.prototype._continue = function(err, req, res, next, ystate) {
  //name = uri.parse(name).pathname; // TODO: test case for query parsing
  
  // NEW
  var url = ystate && ystate.returnTo;
  if (url) {
    return res.redirect(url);
  }
  
  return;
  
  /*
  if (!state) { return next(new Error("Unknown state '" + name + "'")); }
  if (!state.resume) { return next(new Error("Unable to resume state '" + name + "'")); }
  
  // TODO: Allow for options here?
  var complete = completeState(this, {});
  var completeError = completeStateError(this, {});
  var unfinished = unfinishedState();
  
  var stack = state.resume.concat([complete, completeError]);
  if (state.exit) {
    stack.push.apply(stack, state.exit)
  }
  stack.push(unfinished);
  
  req._skipCompleteStateError = false;
  dispatch(stack)(err, req, res, next);
  */
}

Manager.prototype._yield = function(options, err, req, res, next) {
  return next();
  
  // FIXME: there are two tests (in sso/oauth and sso/oauth2 that dependend on this code)
  //        factor the fix somewhere else.  It is probalby the `postFns` related code here
  
  // TODO: Comment out this whole piece and fix tests.  Nothing depends on yields anymore
  /*
  var t = req.state.name || (req.yieldState && req.yieldState.returnTo)
    , f = req.yieldState.name || req.originalUrl || req.url;
  
  t = uri.parse(t).pathname; // TODO: test case for query parsing
  f = uri.parse(f).pathname; // TODO: test case for query parsing
  
  req.yieldStateStack = req.yieldStateStack || [];
  req.yieldStateStack.unshift(req.yieldState);
  
  var stack = this._yielders[t + '|' + f];
  if (!stack) {
    if (options && options.postFns) {
      dispatchReal(options.postFns)(err, req, res, function(err) {
        // TODO: handle err, with test case
        return next(err);
      });
      return;
    }
  
    return next(err);
  }
  dispatch(stack)(err, req, res, next);
  */
}

module.exports = Manager;
