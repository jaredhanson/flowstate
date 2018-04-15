/**
 * Module dependencies.
 */
var State = require('../state')
  , MissingStateError = require('../errors/missingstateerror');


/**
 * Complete state.
 *
 * This middleware is used to complete a stateful interaction.
 */
module.exports = function(dispatcher, store, options) {
  
  return function completeState(req, res, next) {
    req._stateTransitions = req._stateTransitions || 0;
    req.state.complete();
    
    req._skipResumeError = true;
    
    return dispatcher._complete(options, null, req, res, next);
  };
};
