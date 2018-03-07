var loadState = require('./load');


module.exports = function(dispatcher, store, options) {
  if (typeof options == 'string') {
    options = { name: options };
  }
  options = options || {};
  
  var name = options.name;
  
  
  return function flow(req, res, next) {
    
    res.prompt = function prompt(name, options) {
      console.log('>>> PROMPT: ' + name);
      console.log(options)
      
      dispatcher.goto(name, options, req, res, function(err) {
        // TODO: Implement this
        console.log('ERROR?')
        console.log(err);
      });
    }
    
    next();
  };
};
