var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , completeStateError = require('../../lib/middleware/completeError');


/*
describe('middleware/completeError', function() {
  
  describe('handling an error encountered when resuming parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { x: 1 });
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          req.state = { name: 'foo', x: 1 };
          req.yieldState = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
          req._skipResumeError = true;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong while resuming parent state'));
    });
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong while resuming parent state');
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should preserve yield state', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // handling an error encountered when resuming a parent state
  
});
*/
