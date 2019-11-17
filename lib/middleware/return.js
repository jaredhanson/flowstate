module.exports = function(dispatcher, options) {
  
  return function completeState(req, res, next) {
    var state = req.state;
    
    var url = req.state.returnTo;
    if (url) {
      return res.redirect(url);
    }
    
    url = (req.query && req.query.return_to) || (req.body && req.body.return_to);
    if (url) {
      return res.redirect(url);
    }
    
    return next();
  };
};
