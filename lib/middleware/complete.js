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
    
    // At this point, the request is ready to be dispatched to the middleware
    // chain that will resume processing of the parent state, if any.  This
    // currently executing middleware is paired with `completeError` on the
    // middleware chain for the current request.
    //
    // If an error occurs while resuming the parent state, we want to avoid a
    // double-dispatch when `completeError` is invoked.  As such, we set a flag
    // to check for that condition.  This effectively ensures that
    // `completeError` executes only for errors encountered in the processing of
    // the current state.
    req._skipCompleteStateError = true;
    
    return dispatcher._complete(options, null, req, res, next);
  };
};
