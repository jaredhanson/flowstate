var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , loadState = require('../../lib/middleware/load')
  , Dispatcher = require('../../lib/manager');


describe('load', function() {
  
  it('should be named loadState', function() {
    var store = new Object();
    expect(loadState(store).name).to.equal('loadState');
  });
  
  describe('loading state without handle', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store))
        .req(function(req) {
          request = req;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
  });
  
});
