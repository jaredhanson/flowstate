var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , resumeState = require('../../lib/middleware/resume');


describe('middleware/resume', function() {
  
  it('should be named resumeState', function() {
    var dispatcher = new Object();
    var store = new Object();
    expect(resumeState(dispatcher, store).name).to.equal('resumeState');
  });
  
  describe('resuming state without state', function() {
    var dispatcher = {
      _resume: function(){}
    };
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.spy(dispatcher, '_resume');
      sinon.stub(store, 'load').yields(null, undefined);
    });
    
    after(function() {
      store.load.restore();
      dispatcher._resume.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(resumeState(dispatcher, store))
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
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
});
