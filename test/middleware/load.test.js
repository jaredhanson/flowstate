var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , loadState = require('../../lib/middleware/load')
  , ExpiredStateError = require('../../lib/errors/expiredstateerror');

/*
describe('middleware/load', function() {
  
  it('should be named loadState', function() {
    var store = new Object();
    expect(loadState(store).name).to.equal('loadState');
  });
  
  describe('loading state with state query parameter', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store))
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
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading state with state body parameter', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store))
        .req(function(req) {
          request = req;
          req.body = { state: '12345678' };
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
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading state with custom parameter', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      function getHandle(req) {
        return req.query.s;
      }
      
      chai.connect.use(loadState(store, { getHandle: getHandle }))
        .req(function(req) {
          request = req;
          req.query = { s: '12345678' };
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
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading named state where state matches', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store, { name: 'test' }))
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
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading named state where state matches, using string as argument', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store, 'test'))
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
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading named state where state does not match', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store, { name: 'xtest' }))
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
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should set optimized state', function() {
      expect(request._state).to.be.an('object');
      expect(request._state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading named and required state where state does not match', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(null, { name: 'test', x: 1 });
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store, { name: 'xtest', required: true }))
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
      expect(err.message).to.equal("Failed to load required state 'xtest'");
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should set optimized state', function() {
      expect(request._state).to.be.an('object');
      expect(request._state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('attempting to load state with state query parameter', function() {
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
          req.query = { state: '12345678' };
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
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('attempting to load named state with state query parameter', function() {
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
      chai.connect.use(loadState(store, 'test'))
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
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('attempting to load required state with state query parameter', function() {
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
      chai.connect.use(loadState(store, { required: true }))
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
      expect(err.message).to.equal("Failed to load required state");
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('attempting to load named and required state with state query parameter', function() {
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
      chai.connect.use(loadState(store, { name: 'test', required: true }))
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
      expect(err.message).to.equal("Failed to load required state 'test'");
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('attempting to load state without handle', function() {
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
  
  describe('attempting to load required state without handle', function() {
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
      chai.connect.use(loadState(store, { required: true }))
        .req(function(req) {
          request = req;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("Failed to load required state");
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
  });
  
  describe('attempting to load named and required state without handle', function() {
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
      chai.connect.use(loadState(store, { name: 'test', required: true }))
        .req(function(req) {
          request = req;
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal("Failed to load required state 'test'");
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
  });
  
  describe('loading an expired state', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new ExpiredStateError('state expired', { name: 'test', x: 1 }));
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store))
        .req(function(req) {
          request = req;
          req.body = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('state expired');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading an expired named state where state matches', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new ExpiredStateError('state expired', { name: 'test', x: 1 }));
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store, { name: 'test' }))
        .req(function(req) {
          request = req;
          req.body = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('state expired');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'test',
        x: 1
      });
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('loading an expired named state where state does not match', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new ExpiredStateError('state expired', { name: 'test', x: 1 }));
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store, { name: 'xtest' }))
        .req(function(req) {
          request = req;
          req.body = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('state expired');
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
  describe('encountering an error loading state', function() {
    var store = {
      load: function(){}
    };
    
    before(function() {
      sinon.stub(store, 'load').yields(new Error('something went wrong'));
    });
    
    after(function() {
      store.load.restore();
    });
    
    
    var request, err;
    before(function(done) {
      chai.connect.use(loadState(store))
        .req(function(req) {
          request = req;
          req.body = { state: '12345678' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should not set state', function() {
      expect(request.state).to.be.undefined;
    });
    
    it('should call store#load', function() {
      expect(store.load).to.have.been.calledOnce;
      var call = store.load.getCall(0);
      expect(call.args[0]).to.equal(request);
      expect(call.args[1]).to.equal('12345678');
    });
  });
  
});
*/
