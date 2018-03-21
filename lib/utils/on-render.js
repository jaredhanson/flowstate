// https://github.com/jshttp/on-headers


function createRender(prevRender, fn) {
  var fired = false;

  // return function with core name and argument list
  return function render(view, options, callback) {
    //console.log('SWIZZLED REDIRECT');
    
    
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    
    fn.call(this, function(err) {
      
      prevRender.apply(self, args);
    });
  }
}

function swizzleRender(res, fn) {
  res.render = createRender(res.render, fn);
}


exports = module.exports = swizzleRender;
