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
  
  describe('resuming previous state from current state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'foo', x: 1 });
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_resume');
      sinon.spy(dispatcher, '_transition');
    });
    
    after(function() {
      dispatcher._transition.restore();
      dispatcher._resume.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(resumeState(dispatcher, store))
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
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: "22345678",
        name: 'bar',
        y: 2,
        prev: "12345678"
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
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
    });
  });
  
  describe('attempting to resume previous state from current state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_resume');
    });
    
    after(function() {
      dispatcher._resume.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(resumeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2 };
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
  describe('attempting to resume previous state without current state', function() {
    var dispatcher = {
      _resume: function(){}
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_resume');
    });
    
    after(function() {
      dispatcher._resume.restore();
      store.destroy.restore();
      store.load.restore();
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
  
  describe('attempting to resume previous state, which fails to be loaded', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_resume');
    });
    
    after(function() {
      dispatcher._resume.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(resumeState(dispatcher, store))
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
      expect(err.constructor.name).to.equal('MissingStateError');
      expect(err.message).to.equal('Failed to load previous state');
      expect(err.handle).to.equal('12345678');
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
  describe('encountering an error destroying state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'foo', x: 1 });
      sinon.stub(store, 'destroy').yields(new Error('something went wrong destroying state'));
      sinon.spy(dispatcher, '_resume');
    });
    
    after(function() {
      dispatcher._resume.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(resumeState(dispatcher, store))
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
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
  describe('encountering an error loading state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new Error('something went wrong loading state'));
      sinon.stub(store, 'destroy').yields(null);
      sinon.spy(dispatcher, '_resume');
    });
    
    after(function() {
      dispatcher._resume.restore();
      store.destroy.restore();
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(resumeState(dispatcher, store))
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
    
    it('should not set state', function() {
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
});
