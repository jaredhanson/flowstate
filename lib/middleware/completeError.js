/**
 * Complete state with error.
 *
 * This middleware is used to complete a stateful interaction with an error.
 */
module.exports = function(dispatcher, options) {
  
  return function completeStateError(err, req, res, next) {
    if (req._skipCompleteStateError) { return next(err); }
    
    req.state.complete();
    
    return dispatcher._complete(options, err, req, res, next);
  };
};
