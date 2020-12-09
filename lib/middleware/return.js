module.exports = function(dispatcher, options) {
  
  return function completeState(req, res, next) {
    var state = req.state;
    
    var resume = req.state.resume;
    if (resume) {
      dispatcher._store.load(req, resume, function(err, state) {
        if (err) { return next(err); }
        // TODO: Better query serialization
        res.redirect(state.location + '?state=' + resume);
      });
      
      return;
    }
    
    
    var url = req.state.returnTo;
    if (url) {
      return res.redirect(url);
    }
    
    url = (req.query && req.query.return_to) || (req.body && req.body.return_to);
    if (url) {
      return res.redirect(url);
    }
    
    //return res.redirect('/home')
    
    return next();
  };
};
