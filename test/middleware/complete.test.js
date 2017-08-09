var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , completeState = require('../../lib/middleware/complete');


describe('middleware/complete', function() {
  
  it('should be named completeState', function() {
    var dispatcher = new Object();
    var store = new Object();
    expect(completeState(dispatcher, store).name).to.equal('completeState');
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, up: '12345678' };
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
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
        up: '12345678'
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
      expect(call.args[2]).to.be.null;
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.undefined;
    });
  }); // resuming previous state from current state
  
  describe('resuming previous state with non-yielding state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
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
      chai.connect.use(completeState(dispatcher, store, { name: 'baz' }))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, up: '12345678' };
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        up: '12345678'
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
      expect(call.args[2]).to.be.null;
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('bar');
      expect(call.args[1]).to.be.undefined;
    });
  }); // resuming previous state with non-yielding state
  
  describe('resuming previous state with optimized previous state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request._state = { name: 'foo', x: 1 };
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
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
      expect(call.args[1]).to.be.undefined;
    });
  }); // resuming previous state with optimized previous state
  
  describe('resuming previous state with optimized previous state from named state', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
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
      chai.connect.use(completeState(dispatcher, store, { name: 'bar' }))
        .req(function(req) {
          request = req;
          request._state = { name: 'foo', x: 1 };
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
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
      expect(call.args[2]).to.be.null;
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.undefined;
    });
  }); // resuming previous state with optimized previous state from named state
  
  describe('resuming previous state where current state is loaded and resumes', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      var stub = sinon.stub(store, 'load');
      stub.onCall(0).yields(null, { handle: '22345678', name: 'bar', y: 2, up: '12345678' })
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
      chai.connect.use(completeState(dispatcher, store, { name: 'bar' }))
        .req(function(req) {
          request = req;
          req.query = { state: '22345678' };
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
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
        up: '12345678'
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
      expect(call.args[2]).to.be.null;
    });
    
    it('should call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.have.been.calledOnce;
      var call = dispatcher._resume.getCall(0);
      expect(call.args[0]).to.equal('foo');
      expect(call.args[1]).to.be.undefined;
    });
  }); // resuming previous state where current state is loaded and resumes
  
  describe('attempting to resume previous state from current state and proceeding to default behavior', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
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
      chai.connect.use(completeState(dispatcher, store))
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2
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
    
    it('should not call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  }); // attempting to resume previous state from current state and proceeding to default behavior
  
  describe('attempting to resume previous state where current state is loaded and proceeds to default behavior', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { handle: '22345678', name: 'bar', y: 2 });
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
      chai.connect.use(completeState(dispatcher, store, { name: 'bar' }))
        .req(function(req) {
          request = req;
          req.query = { state: '22345678' };
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.have.been.calledOnce;
      var call = store.destroy.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('22345678');
    });
    
    it('should not call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  }); // attempting to resume previous state where current state is loaded and proceeds to default behavior
  
  describe('attempting to resume previous state without current state and without state parameters', function() {
    var dispatcher = {
      _resume: function(){},
      _transition: function(){}
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
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
      chai.connect.use(completeState(dispatcher, store))
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
    
    it('should set skip error flag', function() {
      expect(request._skipResumeError).to.equal(true);
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#load', function() {
      expect(store.load).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_transition', function() {
      expect(dispatcher._transition).to.not.have.been.called;
    });
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  }); // attempting to resume previous state without current state and without state parameters
  
  describe('attempting to resume previous state which fails to be loaded', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(); }
    };
    var store = {
      load: function(){},
      destroy: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, undefined);
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, up: '12345678' };
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
      expect(err.message).to.equal('Failed to load parent state');
      expect(err.handle).to.equal('12345678');
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
        up: '12345678'
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
  }); // attempting to resume previous state which fails to be loaded
  
  describe('encountering an error destroying current state', function() {
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, up: '12345678' };
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
        up: '12345678'
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
  describe('encountering an error loading previous state', function() {
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
      chai.connect.use(completeState(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, up: '12345678' };
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
        up: '12345678'
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
