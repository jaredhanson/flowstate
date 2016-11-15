var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , resumeStateError = require('../../lib/middleware/resumeError');


describe('middleware/resumeError', function() {
  
  it('should be named resumeStateError', function() {
    var dispatcher = new Object();
    var store = new Object();
    expect(resumeStateError(dispatcher, store).name).to.equal('resumeStateError');
  });
  
  describe('resuming previous state from current state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
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
      chai.connect.use(resumeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
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
    
    it('should call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.have.been.calledOnce;
      var call = dispatcher._transition.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.equal('bar');
      expect(call.args[2]).to.be.an.instanceOf(Error);
      expect(call.args[2].message).to.equal('something went wrong');
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.an.instanceOf(Error);
      expect(call.args[1].message).to.equal('something went wrong');
    });
  });
  
  describe('resuming previous state with non-yielding state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null);
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
      chai.connect.use(resumeStateError(dispatcher, store, { from: 'baz' }))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should not error', function() {
      expect(err).to.be.undefined;
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
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.have.been.calledOnce;
      var call = dispatcher._transition.getCall(0);
      expect(call.args[0]).to.equal('bar');
      expect(call.args[1]).to.equal('baz');
      expect(call.args[2]).to.be.an.instanceOf(Error);
      expect(call.args[2].message).to.equal('something went wrong');
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('bar');
      expect(call.args[1]).to.be.an.instanceOf(Error);
      expect(call.args[1].message).to.equal('something went wrong');
    });
  });
  
  describe('resuming previous state without current state, but optimized previous state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null);
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
      chai.connect.use(resumeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request._state = { name: 'foo', x: 1 };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.not.have.been.called;
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.an.instanceOf(Error);
      expect(call.args[1].message).to.equal('something went wrong');
    });
  });
  
  describe('resuming explicitly named previous state without current state, but optimized previous state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null);
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
      chai.connect.use(resumeStateError(dispatcher, store, { from: 'bar' }))
        .req(function(req) {
          request = req;
          request._state = { name: 'foo', x: 1 };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.have.been.calledOnce;
      var call = dispatcher._transition.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.equal('bar');
      expect(call.args[2]).to.be.an.instanceOf(Error);
      expect(call.args[2].message).to.equal('something went wrong');
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.an.instanceOf(Error);
      expect(call.args[1].message).to.equal('something went wrong');
    });
  });
  
  describe('resuming previous state without current state, where current state is loaded and resumes', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      var stub = sinon.stub(store, 'load');
      stub.onCall(0).yields(null, { handle: '22345678', name: 'bar', y: 2, prev: '12345678' })
      stub.onCall(1).yields(null, { name: 'foo', x: 1 });
      
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
      chai.connect.use(resumeStateError(dispatcher, store, { from: 'bar' }))
        .req(function(req) {
          request = req;
          req.query = { state: '22345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
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
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should call store#load to load current state', function() {
      expect(store.load).to.have.been.calledTwice;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#destroy to destroy current state', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should call store#load to load previous state', function() {
      expect(store.load).to.have.been.calledTwice;
      var call = store.load.getCall(1);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
    
    it('should call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.have.been.calledOnce;
      var call = dispatcher._transition.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.equal('bar');
      expect(call.args[2]).to.be.an.instanceOf(Error);
      expect(call.args[2].message).to.equal('something went wrong');
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.an.instanceOf(Error);
      expect(call.args[1].message).to.equal('something went wrong');
    });
  });
  
});
