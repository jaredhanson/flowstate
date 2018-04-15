var Meta = module.exports = function Meta(extern, synth) {
  this.external = extern;
  this.synthentic = synth;
  
  this.originalHash = null;
  this.savedHash = null;
  this.touched = false;
  this.complete = false;
  this.keeped = false;
  this.destroyed = false;
}


Meta.prototype = {
  
  toJSON: function() {
    return;
  }
  
};
