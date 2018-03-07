var loadState = require('./load')
  , finishState = require('./complete')
  , failState = require('./completeError')


module.exports = function(dispatcher, store, name, _rest) {
  var options = {};
  
  
  console.log('!!!!!');
  //console.log(dispatcher)
  console.log(name);
  console.log(options)
  
  var fns = Array.prototype.slice.call(arguments, 3);
  console.log(fns)
  if (typeof fns[fns.length - 1] == 'object') {
    console.log('OBJECT!!!!');
    options = fns.pop();
    console.log(options);
    console.log(fns)
  }
  
  
  options.name = name;
  
  var completeState = finishState(dispatcher, store, options);
  var completeErrorState = failState(dispatcher, store, options);
  
  fns.push(completeState);
  fns.push(completeErrorState);
  fns.unshift(loadState(store, options));
  fns.unshift(init);
  
  function init(req, res, next) {
    
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
    
    res.resumeState = function resumeState(err, next) {
      if (typeof err == 'function') {
        next = err;
        err = null;
      }
      
      console.log("RESUME?!");
      console.log(req.state)
      
      req.__finishedTask = true;
      
      //delete req.state.prev
      
      completeState(req, res, next)
    };
    
    next();
  };
  
  return fns;
};
