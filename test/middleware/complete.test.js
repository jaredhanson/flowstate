var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , completeState = require('../../lib/middleware/complete');


/*
describe('middleware/complete', function() {
  
  describe('encountering an error destroying state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'foo', x: 1 });
      sinon.stub(store, 'destroy').yields(new Error('something went wrong destroying state'));
      sinon.spy(dispatcher, '_dispatch');
    });
    
    after(function() {
      dispatcher._dispatch.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong destroying state');
    });
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // encountering an error destroying state
  
  describe('encountering an error loading parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new Error('something went wrong loading state'));
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong loading state');
    });
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should not call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.not.have.been.called;
    });
  }); // encountering an error loading parent state
  
  describe('encountering an error resuming unnamed parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(new Error("Cannot dispatch to unnamed state")); }
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Cannot dispatch to unnamed state');
    });
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.have.been.calledOnce;
      var call = dispatcher._dispatch.getCall(0);
      expect(call.args[0]).to.be.undefined;
      expect(call.args[1]).to.be.undefined;
      expect(call.args[2]).to.be.undefined;
      expect(call.args[3]).to.be.null;
    });
  }); // encountering an error resuming unnamed parent state
  
  describe('encountering an error resuming unloaded unnamed parent state', function() {
    var dispatcher = {
      _dispatch: function(name, from, through, err, req, res, next){ next(new Error("Cannot dispatch to unnamed state")); }
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          req.query = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Cannot dispatch to unnamed state');
    });
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        x: 1
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should call dispatcher#_dispatch', function() {
      expect(dispatcher._dispatch).to.have.been.calledOnce;
      var call = dispatcher._dispatch.getCall(0);
      expect(call.args[0]).to.be.undefined;
      expect(call.args[1]).to.be.undefined;
      expect(call.args[2]).to.be.undefined;
      expect(call.args[3]).to.be.null;
    });
  }); // encountering an error resuming unloaded unnamed parent state
  
});
*/
