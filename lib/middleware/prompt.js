var dispatch = require('../utils').dispatch;


module.exports = function(state, actionMethods) {
  actionMethods = actionMethods || [ 'POST' ];
  
  return function prompt(req, res, next) {
    if (!state.prompt) { return next(); }
    if (actionMethods.indexOf(req.method) !== -1) {
      // This request was the result of a user performing an action on a prompt
      // that was previously rendered.  This action typically results in a form
      // being submitted via HTTP POST.  Because the user has performed the
      // necessary action, there is no need to reprompt.
      return next();
    }
    
    dispatch(state.prompt)(null, req, res, next);
  };
};
