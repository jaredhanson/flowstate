/**
 * Module dependencies.
 */
var State = require('../state')
  , ExpiredStateError = require('../errors/expiredstateerror');


/**
 * Complete state with error.
 *
 * This middleware is used to complete a stateful interaction with an error.
 */
module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  var from = options.name
    , through = options.through
  var getHandle = options.getHandle || function(req) {
    return (req.query && req.query.state) || (req.body && req.body.state);
  }
  
  
  return function completeStateError(err, req, res, next) {
    if (req._skipResumeError) { return next(err); }
    
    req._stateTransitions = req._stateTransitions || 0;
    // TODO: Remove the function type check
    if (req.state && typeof req.state.complete == 'function') { req.state.complete(); }
    
    return dispatcher._complete(options, err, req, res, next);
  };
};
