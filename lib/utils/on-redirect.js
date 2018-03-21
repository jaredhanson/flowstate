// https://github.com/jshttp/on-headers


function createRedirect(prevRedirect, fn) {
  var fired = false;

  // return function with core name and argument list
  return function redirect(url) {
    //console.log('SWIZZLED REDIRECT');
    
    if (arguments.length === 2 && typeof arguments[0] === 'number') {
      url = arguments[1];
    }
    
    
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    
    fn.call(this, url, function(err, url) {
      //console.log('PERSISTED?');
      //console.log(err);
      //console.log(url);
      
      if (url) {
        if (args.length === 2 && typeof args[0] === 'number') {
          // allow status / url
          args[1] = url;
        } else {
          args[0] = url;
        }
      }
      
      //console.log('APPLYING');
      //console.log(args);
      
      prevRedirect.apply(self, args);
    });
  }
}

function swizzleRedirect(res, fn) {
  res.redirect = createRedirect(res.redirect, fn);
}


exports = module.exports = swizzleRedirect;
