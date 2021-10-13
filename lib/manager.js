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
