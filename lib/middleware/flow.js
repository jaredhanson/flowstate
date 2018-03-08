var loadState = require('./load')
  , finishState = require('./complete')
  , failState = require('./completeError')


module.exports = function(dispatcher, store, name, _rest) {
  var options = {}
    , completeState, completeErrorState;
  
  var fns = Array.prototype.slice.call(arguments, 3);
  if (typeof fns[fns.length - 1] == 'object') {
    options = fns.pop();
  }
  options.name = name;
  
  if (options.external) {
    fns.unshift(initialize);
  } else {
    completeState = finishState(dispatcher, store, options);
    completeErrorState = failState(dispatcher, store, options);
    
    fns.unshift(loadState(store, options));
    fns.unshift(initialize);
    fns.push(completeState);
    fns.push(completeErrorState);
  }
  
  function initialize(req, res, next) {
    
    res.prompt = function prompt(name, options) {
      console.log('>>> PROMPT: ' + name);
      console.log(options)
      console.log(req.state);
      console.log(req.oauth2)
      
      dispatcher.goto(name, options, req, res, function(err) {
        // TODO: Implement this
        console.log('ERROR?')
        console.log(err);
      });
    };
    
    res.completePrompt = function resumeState(err, next) {
      if (typeof err == 'function') {
        next = err;
        err = null;
      }
      
      console.log("RESUME?!");
      console.log(req.state)
      
      req.__finishedTask = true;
      
      //delete req.state.prev
      
      if (err) {
        return completeErrorState(err, req, res, next);
      }
      return completeState(req, res, next)
    };
    
    next();
  };
  
  return fns;
};
