var Meta = module.exports = function Meta() {
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
