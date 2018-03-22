var Meta = module.exports = function Meta(options) {
  this.originalHash = null;
}


Meta.prototype = {
  
  get data() {
      return {
        'foo': 'bar'
      }
    },
  
  toJSON: function(){
    return;
  }
  
};
