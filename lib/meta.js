var Meta = module.exports = function Meta() {
  this.originalHash = null;
  this.savedHash = null;
  //this.complete = false;
  this.destroyed = false;
}

// TODO: This can be commented out.
Meta.prototype = {
  
  toJSON: function() {
    return;
  }
  
};
