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
  
  return function completeStateError(err, req, res, next) {
    if (req._skipResumeError) { return next(err); }
    
    req._stateTransitions = req._stateTransitions || 0;
    req.state.complete();
    
    return dispatcher._complete(options, err, req, res, next);
  };
};
