// https://github.com/jshttp/on-headers


function createEnd(prevEnd, fn) {
  var fired = false;

  // return function with core name and argument list
  return function render(chunk, encoding) {
    //console.log('SWIZZLED REDIRECT');
    
    // FIXME: don't delete states on error
    
    var self = this;
    var args = Array.prototype.slice.call(arguments);
    
    fn.call(this, function(err) {
      
      prevEnd.apply(self, args);
    });
  }
}

function swizzleEnd(res, fn) {
  res.end = createEnd(res.end, fn);
}


exports = module.exports = swizzleEnd;
