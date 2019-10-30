module.exports = function(dispatcher, options) {
  
  return function completeState(req, res, next) {
    var state = req.state;
    
    var url = state.returnTo;
    if (!url) { return next(); }
    
    return res.redirect(url);
  };
};
