module.exports = function() {
  
  return function unfinishedState(req, res, next) {
    console.log(req.next)
    
    req.next(new Error("Unfinished state '" + req.state.name + "'"));
  };
};
