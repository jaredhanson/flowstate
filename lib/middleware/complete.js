/**
 * Complete state.
 *
 * This middleware is used to complete a flow.  When a flow is complete, its
 * associated state will be destroyed.
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
  
  return function completeState(req, res, next) {
    // NEW: Guards added, not in place.  Necessary?
    //if (!req.state.isModified()) {
    req.state.complete();
    //}
    
    // At this point, the request is ready to be dispatched to the middleware
    // chain that will resume processing of the parent state, if any.  This
    // currently executing middleware is paired with `completeError` on the
    // middleware chain for the current request.
    //
    // If an error occurs while resuming the parent state, we want to avoid a
    // double-dispatch when `completeError` is invoked.  As such, we set a flag
    // to check for that condition.  This effectively ensures that
    // `completeError` executes only for errors encountered in the processing of
    // the current state, rather than those occuring when resuming the parent
    // state.
    req._skipCompleteStateError = true;
    
    return dispatcher._complete(options, null, req, res, next);
  };
};
