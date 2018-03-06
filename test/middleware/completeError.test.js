var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , completeStateError = require('../../lib/middleware/completeError');


describe('middleware/completeError', function() {
  
  it('should be named completeError', function() {
    var dispatcher = new Object();
    var store = new Object();
    expect(completeStateError(dispatcher, store).name).to.equal('completeStateError');
  });
  
  describe('resuming parent state from state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store))
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
  }); // resuming parent state from state
  
  describe('resuming parent state from named state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store, { name: 'bar' }))
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
  }); // resuming parent state from named state
  
  describe('resuming parent state from named state, using string as argument', function() {
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
      chai.connect.use(completeStateError(dispatcher, store, 'bar'))
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
  }); // resuming parent state from named state, using string as argument
  
  describe('resuming parent state from named state with non-yielding state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store, { name: 'baz' }))
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
  }); // resuming parent state from named state with non-yielding state
  
  describe('resuming parent state with optimized parent state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store))
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
  }); // resuming parent state with optimized parent state
  
  describe('resuming parent state from named state with optimized parent state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store, { name: 'bar' }))
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
  }); // resuming parent state from named state with optimized parent state
  
  describe('resuming parent state from unloaded state', function() {
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
      stub.onCall(0).yields(null, { name: 'foo', x: 1 });
      
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
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          req.query = { state: '12345678' };
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
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not call store#destroy', function() {
      expect(store.destroy).to.not.have.been.called;
    });
    
    it('should call store#load to load parent state', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
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
  }); // resuming parent state from unloaded state
  
  describe('resuming parent state from unloaded named state query parameter', function() {
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
      chai.connect.use(completeStateError(dispatcher, store, { name: 'bar' }))
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
    
    it('should call store#load to load parent state', function() {
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
  }); // resuming parent state from unloaded named state query parameter
  
  describe('attempting to resume parent state from state and proceeding to default behavior', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
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
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2 };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
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
  }); // attempting to resume parent state from state and proceeding to default behavior
  
  describe('attempting to resume parent state from unloaded named state and proceeding to default behavior', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
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
      chai.connect.use(completeStateError(dispatcher, store, { name: 'bar' }))
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
    
    it('should continue with error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
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
  }); // attempting to resume parent state from unloaded named state and proceeding to default behavior
  
  describe('attempting to resume parent state without state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store))
        .req(function(req) {
          request = req;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch(new Error('something went wrong'));
    });
    
    it('should continue with error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
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
  }); // attempting to resume parent state without state
  
  describe('attempting to resume parent state which is not found', function() {
    var dispatcher = {
      _resume: function(name, err, req, res, next){ next(); },
      _transition: function(name, from, err, req, res, next){ next(err); }
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
      chai.connect.use(completeStateError(dispatcher, store))
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
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  }); // attempting to resume parent state which is not found
  
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
      chai.connect.use(completeStateError(dispatcher, store))
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
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  });
  
  describe('encountering an error loading parent state', function() {
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
      chai.connect.use(completeStateError(dispatcher, store))
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
    
    it('should continue with original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
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
    
    it('should not call dispatcher#_resume', function() {
      expect(dispatcher._resume).to.not.have.been.called;
    });
  }); // encountering an error loading parent state
  
});
