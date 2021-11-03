var Meta = module.exports = function Meta(extern) {
  this.external = extern;
  
  this.originalHash = null;
  this.savedHash = null;
  this.touched = false;
  this.complete = false;
  this.destroyed = false;
}


Meta.prototype = {
  
  toJSON: function() {
    return;
  }
  
};
