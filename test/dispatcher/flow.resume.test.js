var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (resume)', function() {
  
  describe('finish by redirecting', function() {
    
  }); // finish by redirecting
  
  
  describe('finish by rendering', function() {
    
  }); // finish by rendering
  
  
  describe('continue by rendering', function() {
    
  }); // continue by rendering
  
  
  describe('not finishing', function() {
    
  });
  
  
  describe('failure', function() {
    
    describe('due to parent state not found', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          res.__track = req.state.name;
          next();
        }
      
      
        chai.express.handler(dispatcher.flow('federate', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H2'] = { name: 'federate', verifier: 'secret', state: 'H1' };
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
    
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('MissingStateError');
        expect(err.message).to.equal('Failed to load parent state');
        expect(err.handle).to.equal('H1');
      });
    
      it('should track correctly', function() {
        expect(response.__track).to.equal('federate');
      });
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.load.getCall(1);
        expect(call.args[1]).to.equal('H1');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
      
        expect(dispatcher._store.destroy).to.have.callCount(1);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H2');
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.be.null;
        expect(request.state).to.deep.equal({
          name: 'federate',
          verifier: 'secret',
          state: 'H1'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    }); // due to parent state not found
    
    describe('due to parent state not found after error', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('something went wrong'));
        }
      
      
        chai.express.handler(dispatcher.flow('federate', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H2'] = { name: 'federate', verifier: 'secret', state: 'H1' };
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
    
    
      it('should preserve error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    
      it('should track correctly', function() {
        expect(response.__track).to.equal('federate');
      });
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.load.getCall(1);
        expect(call.args[1]).to.equal('H1');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
      
        expect(dispatcher._store.destroy).to.have.callCount(1);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H2');
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.be.null;
        expect(request.state).to.deep.equal({
          name: 'federate',
          verifier: 'secret',
          state: 'H1'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    }); // due to parent state not found after error
    
    describe('due to state referenced by query param not found', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          res.__track = req.state.name;
          next();
        }
      
      
        chai.express.handler(dispatcher.flow('consent', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H1' };
            request.session = { state: {} };
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
    
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('MissingStateError');
        expect(err.message).to.equal('Failed to load state');
        expect(err.handle).to.equal('H1');
      });
    
      it('should track correctly', function() {
        expect(response.__track).to.equal('consent');
      });
    
      // FIXME: this should only call load once, but calls it twice
      it.skip('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H1');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.be.undefined;
        expect(request.state).to.deep.equal({
          name: 'consent'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain existing session', function() {
        expect(request.session).to.deep.equal({ state: {} });
      });
    }); // due to state referenced by query param not found
    
    // NOTE: This can be removed, state names no longer used.
    /*
    describe('due to state not being registered', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          res.__track = req.state.name;
          next();
        }
      
      
        chai.express.handler(dispatcher.flow('federate', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'login' };
            request.session.state['H2'] = { name: 'federate', verifier: 'secret', state: 'H1' };
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
    
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('Error');
        expect(err.message).to.equal("Unknown state 'login'");
      });
    
      it('should track correctly', function() {
        expect(response.__track).to.equal('federate');
      });
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.load.getCall(1);
        expect(call.args[1]).to.equal('H1');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
      
        expect(dispatcher._store.destroy).to.have.callCount(1);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H2');
      });
    
      // FIXME: should set state to federate here
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.equal('H1');
        expect(request.state).to.deep.equal({ name: 'login' });
      });
      */
    
      // FIXME: should not yeild
      /*
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.null;
        expect(request.yieldState).to.deep.equal({
          name: 'federate',
          verifier: 'secret',
          state: 'H1'
        });
      });
      */
    
      /*
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { name: 'login' }
        } });
      });
    }); // due to state not being registered
    */
    
  }); // failure
  
});
