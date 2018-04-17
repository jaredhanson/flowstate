/**
 * Complete state with error.
 *
 * This middleware is used to complete a flow with an error.  When a flow is
 * complete, its associated state will be destroyed.
 *
 * If the flow was initiated by another flow, known as the parent flow, the
 * parent flow will be resumed and processing will continue.  The parent flow's
 * state will be restored to the point when it initiated the child flow.  The
 * result from the child flow will be yeilded back to the parent flow.  Once
 * the parent flow has resumed, any remaining middleware for the current route
 * (and completed flow) will not be invoked.
 *
 * If the flow was not initiated by another flow, the request is a typical
 * stateless HTTP request.  The flow will be finished by invoking the flow's
 * finish middleware, if any, and then invoking any remaining route middleware.
 *
 * @api private
 */
module.exports = function(dispatcher, options) {
  
  return function completeStateError(err, req, res, next) {
    if (req._skipCompleteStateError) { return next(err); }
    
    req.state.complete();
    
    return dispatcher._complete(options, err, req, res, next);
  };
};
