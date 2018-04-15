var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow', function() {
  
  
  
  
  /***/
  
  // TODO: continuing from a new state without parent state (loading finish handlers from registered state)
  
  // TODO: Modify new and current states and rerender.  Test for persisting state.
  // TODO: Prompt from new and current states
  
  
  
  /***/
  
  describe('resuming from current state where state is carried in custom query param and finishing by redirecting', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      function getHandle(req) {
        return req.query.s;
      }
      
      chai.express.handler(dispatcher.flow('federate', handler, { getHandle: getHandle }))
        .req(function(req) {
          request = req;
          request.query = { s: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'login' };
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate login(federate)[F]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(2);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H2');
      var call = dispatcher._store.load.getCall(1);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      var call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H2');
      var call = dispatcher._store.destroy.getCall(1);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: 'login'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: 'federate',
        verifier: 'secret',
        parent: 'H1'
      });
    });
    
    it('should remove completed state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/login');
    });
  }); // resuming from current state and finishing by redirecting
  
  describe('resuming with error from current state where state is carried in custom query param and finishing by redirecting', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          next();
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          res.redirect('/from/' + req.state.name);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('invalid login'));
      }
      
      
      function getHandle(req) {
        return req.query.s;
      }
      
      chai.express.handler(dispatcher.flow('federate', handler, { getHandle: getHandle }))
        .req(function(req) {
          request = req;
          request.query = { s: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'login' };
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate E:login(federate)[E]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(2);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H2');
      var call = dispatcher._store.load.getCall(1);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      var call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H2');
      var call = dispatcher._store.destroy.getCall(1);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: 'login'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: 'federate',
        verifier: 'secret',
        parent: 'H1'
      });
    });
    
    it('should remove completed state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/login');
    });
  }); // resuming with error from current state and finishing by redirecting
  
  describe('failing to resume from current state due to state not found', function() {
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
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
      expect(err.message).to.equal('Failed to load previous state');
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
        parent: 'H1'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should remove completed state in session', function() {
      expect(request.session).to.deep.equal({});
    });
  }); // failing to resume from current state due to state not found
  
  describe('failing to resume with error from current state due to state not found', function() {
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
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
    
    
    it('should continue with original error', function() {
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
        parent: 'H1'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should remove completed state in session', function() {
      expect(request.session).to.deep.equal({});
    });
  }); // failing to resume with error from current state due to state not found
  
  describe('failing to resume from current state due to parent state being unnamed', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('federate', handler))
        .req(function(req) {
          request = req;
          request.query = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { xname: 'login' };
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
      expect(err.message).to.equal('Cannot resume unnamed flow');
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
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({ xname: 'login' });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: 'federate',
        verifier: 'secret',
        parent: 'H1'
      });
    });
    
    it('should leave state in session', function() {
      expect(request.session).to.deep.equal({ state: {
        'H1': { xname: 'login' }
      } });
    });
  }); // failing to resume from current state due to parent state being unnamed
  
  describe('failing to resume with error from current state due to parent state being unnamed', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('something went wrong'));
      }
      
      
      chai.express.handler(dispatcher.flow('federate', handler))
        .req(function(req) {
          request = req;
          request.query = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { xname: 'login' };
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
      expect(err.message).to.equal('Cannot resume unnamed flow');
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
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({ xname: 'login' });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: 'federate',
        verifier: 'secret',
        parent: 'H1'
      });
    });
    
    it('should leave state in session', function() {
      expect(request.session).to.deep.equal({ state: {
        'H1': { xname: 'login' }
      } });
    });
  }); // failing to resume with error from current state due to parent state being unnamed
  
  describe('encountering an error destroying state while resuming from current state', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.stub(dispatcher._store, 'destroy').yields(new Error('something went wrong destroying state'));
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
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
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
      expect(err.message).to.equal('something went wrong destroying state');
    });
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H2');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(1);
      var call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H2');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H2');
      expect(request.state).to.deep.equal({
        name: 'federate',
        verifier: 'secret',
        parent: 'H1'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should leave state in session', function() {
      expect(request.session).to.deep.equal({ state: {
        'H1': { name: 'login' },
        'H2': { name: 'federate', verifier: 'secret', parent: 'H1' }
      } });
    });
  }); // encountering an error destroying state while resuming from current state
  
  describe('encountering an error destroying state while resuming from current state with error', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.stub(dispatcher._store, 'destroy').yields(new Error('something went wrong destroying state'));
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('something went wrong'));
      }
      
      
      chai.express.handler(dispatcher.flow('federate', handler))
        .req(function(req) {
          request = req;
          request.query = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'login' };
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
    
    
    it('should original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('Error');
      expect(err.message).to.equal('something went wrong');
    });
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H2');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(1);
      var call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H2');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H2');
      expect(request.state).to.deep.equal({
        name: 'federate',
        verifier: 'secret',
        parent: 'H1'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should leave state in session', function() {
      expect(request.session).to.deep.equal({ state: {
        'H1': { name: 'login' },
        'H2': { name: 'federate', verifier: 'secret', parent: 'H1' }
      } });
    });
  }); // encountering an error destroying state while resuming from current state with error
  
  describe('encountering an error loading parent state while resuming from current state', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.stub(dispatcher._store, 'load')
        .onCall(0).yields(null, { name: 'federate', verifier: 'secret', parent: 'H1' })
        .onCall(1).yields(new Error('something went wrong loading state'));
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
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
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
      expect(err.message).to.equal('something went wrong loading state');
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
        parent: 'H1'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should leave state in session', function() {
      expect(request.session).to.deep.equal({ state: {
        'H1': { name: 'login' }
      } });
    });
  }); // encountering an error loading parent state while resuming from current state
  
  describe('encountering an error loading parent state while resuming from current state with error', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.stub(dispatcher._store, 'load')
        .onCall(0).yields(null, { name: 'federate', verifier: 'secret', parent: 'H1' })
        .onCall(1).yields(new Error('something went wrong loading state'));
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('something went wrong'));
      }
      
      
      chai.express.handler(dispatcher.flow('federate', handler))
        .req(function(req) {
          request = req;
          request.query = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'login' };
          request.session.state['H2'] = { name: 'federate', verifier: 'secret', parent: 'H1' };
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
    
    
    it('should original error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('Error');
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
        parent: 'H1'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should leave state in session', function() {
      expect(request.session).to.deep.equal({ state: {
        'H1': { name: 'login' }
      } });
    });
  }); // encountering an error loading parent state while resuming from current state with error
  
  describe('resuming parent state referenced by query param which finishes by redirecting', function() {
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
      dispatcher.use('start', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('consent', handler))
        .req(function(req) {
          request = req;
          request.query = { state: 'H1' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'start', foo: 'bar' };
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('consent start(consent)[F]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(1);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: 'start',
        foo: 'bar'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'consent'
      });
    });
    
    it('should remove completed parent state from session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // resuming parent state referenced by query param which finishes by redirecting
  
  describe('resuming parent state referenced by custom query param which finishes by redirecting', function() {
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
      dispatcher.use('start', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      function getHandle(req) {
        return req.query.s;
      }
      
      chai.express.handler(dispatcher.flow('consent', handler, { getHandle: getHandle }))
        .req(function(req) {
          request = req;
          request.query = { s: 'H1' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'start', foo: 'bar' };
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('consent start(consent)[F]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(1);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: 'start',
        foo: 'bar'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'consent'
      });
    });
    
    it('should remove completed parent state from session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // resuming parent state referenced by custom query param which finishes by redirecting
  
  describe('resuming with error parent state referenced by body param which resumes by modifying state and rendering', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          req.state.failureCount++;
          res.locals.message = err.message;
          res.render('views/' + req.state.name);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('invalid login'));
      }
      
      
      chai.express.handler(dispatcher.flow('authenticate', handler))
        .req(function(req) {
          request = req;
          request.body = { state: 'H1' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'login', failureCount: 1 };
        })
        .res(function(res) {
          res.locals = {};
        })
        .render(function(res, lay) {
          layout = lay;
          res.end();
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(1);
      var call = dispatcher._store.update.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'login',
        failureCount: 2
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'login',
            failureCount: 2
          }
        }
      });
    });
    
    it('should render layout', function() {
      expect(layout).to.equal('views/login');
      expect(response.locals).to.deep.equal({
        message: 'invalid login',
        state: 'H1'
      });
    });
  }); // resuming with error parent state referenced by body param which resumes by modifying state and rendering
  
  describe('resuming with error parent state referenced by body param which finishes by keeping state and rendering', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          req.state.failureCount++;
          req.state.keep();
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          res.locals.message = err.message;
          res.render('views/' + req.state.name);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('invalid login'));
      }
      
      
      chai.express.handler(dispatcher.flow('authenticate', handler))
        .req(function(req) {
          request = req;
          request.body = { state: 'H1' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'login', failureCount: 2 };
        })
        .res(function(res) {
          res.locals = {};
        })
        .render(function(res, lay) {
          layout = lay;
          res.end();
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)[E]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(1);
      var call = dispatcher._store.update.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'login',
        failureCount: 3
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'login',
            failureCount: 3
          }
        }
      });
    });
    
    it('should render layout', function() {
      expect(layout).to.equal('views/login');
      expect(response.locals).to.deep.equal({
        message: 'invalid login',
        state: 'H1'
      });
    });
  }); // resuming with error parent state referenced by body param which finishes by keeping state and rendering
  
  describe('resuming parent state referenced by query param through synthesized state which finishes by redirecting', function() {
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
      dispatcher.use('start', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('federate', handler, { through: 'login' }))
        .req(function(req) {
          request = req;
          request.query = { state: 'H1' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'start', foo: 'bar' };
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate login(federate) start(login)[F]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(1);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: 'start',
        foo: 'bar'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'login',
        parent: 'H1'
      });
    });
    
    it('should remove completed parent state from session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // resuming parent state referenced by query param through synthesized state which finishes by redirecting
  
  describe('resuming parent state referenced by query param through unsynthesized state which finishes by redirecting', function() {
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
      dispatcher.use('start', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('federate', handler, { through: 'login' }))
        .req(function(req) {
          request = req;
          request.query = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H2'] = { name: 'login', parent: 'H1' };
          request.session.state['H1'] = { name: 'start', foo: 'bar' };
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate login(federate) start(login)[F]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(2);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H2');
      var call = dispatcher._store.load.getCall(1);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H2');
      call = dispatcher._store.destroy.getCall(1);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.null;
      expect(request.state).to.deep.equal({
        name: 'start',
        foo: 'bar'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.null;
      expect(request.yieldState).to.deep.equal({
        name: 'login',
        parent: 'H1'
      });
    });
    
    it('should remove completed states from session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // resuming parent state referenced by query param through unsynthesized state which finishes by redirecting
  
  describe('failing to resume parent state referenced by query param due to state not found', function() {
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
      // FIXME: Failed to load state
      expect(err.message).to.equal('Failed to load previous state');
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
    
    it('should remove completed parent state from session', function() {
      expect(request.session).to.deep.equal({ state: {} });
    });
  }); // failing to resume parent state referenced by query param due to state not found
  
  describe('resuming synthesized state which finishes by redirecting', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('authenticate', handler, { through: 'login' }))
        .req(function(req) {
          request = req;
          request.body = {};
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate login(authenticate)[F]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.undefined;
      expect(request.state).to.deep.equal({
        name: 'login'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/login');
    });
  }); // resuming synthesized state which finishes by redirecting
  
  describe('resuming with error synthesized state which finishes by rendering', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          res.locals.message = err.message;
          res.render('views/error/' + req.state.name);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('something went wrong'));
      }
      
      
      chai.express.handler(dispatcher.flow('authenticate', handler, { through: 'login' }))
        .req(function(req) {
          request = req;
          request.body = {};
          request.session = {};
        })
        .res(function(res) {
          res.locals = {};
        })
        .render(function(res, lay) {
          layout = lay;
          res.end();
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    after(function() {
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
      dispatcher._store.destroy.restore();
    });
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)[E]');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.undefined;
      expect(request.state).to.deep.equal({
        name: 'login'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should render layout', function() {
      expect(layout).to.equal('views/error/login');
      expect(response.locals).to.deep.equal({
        message: 'something went wrong'
      });
    });
  }); // resuming with error synthesized state which finishes by rendering
  
  describe('resuming with error synthesized state which resumes by rendering updated state', function() {
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
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          req.state.failureCount = 1;
          res.locals.message = err.message;
          res.render('views/' + req.state.name);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('invalid login'));
      }
      
      
      chai.express.handler(dispatcher.flow('authenticate', handler, { through: 'login' }))
        .req(function(req) {
          request = req;
          request.body = {};
          request.session = {};
        })
        .res(function(res) {
          res.locals = {};
        })
        .render(function(res, lay) {
          layout = lay;
          res.end();
        })
        .end(function(res) {
          response = res;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'login',
        failureCount: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'login',
            failureCount: 1
          }
        }
      });
    });
    
    it('should render layout', function() {
      expect(layout).to.equal('views/login');
      expect(response.locals).to.deep.equal({
        message: 'invalid login',
        state: 'H1'
      });
    });
  }); // resuming with error synthesized state which resumes by rendering updated state
  
  describe('resuming with error synthesized state which continues with error', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, error;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('something went wrong'));
      }
      
      function errorHandler(err, req, res, next) {
        res.__track += '/E';
        next(err);
      }
      
      
      chai.express.handler([dispatcher.flow('authenticate', handler, { through: 'login' }), errorHandler])
        .req(function(req) {
          request = req;
          request.body = {};
          request.session = {};
        })
        .res(function(res) {
          response = res;
        })
        .next(function(err) {
          error = err;
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
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)[E]/E');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.undefined;
      expect(request.state).to.deep.equal({
        name: 'login'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should continue with error', function() {
      expect(error.message).to.equal('something went wrong');
    });
  }); // resuming with error synthesized state which continues with error
  
  describe.skip('resuming parent state from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('bar', handler))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'bar', y: 2, parent: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.equal('H2');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        y: 2,
        parent: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('bar foo(bar)');
    });
  }); // resuming parent state from stored child state
  
  describe.skip('resuming parent state yielding from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          req.state.y = req.yieldState.y;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('bar', handler))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'bar', y: 2, parent: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1,
        y: 2
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.equal('H2');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        y: 2,
        parent: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('bar --bar/foo--> foo(bar)');
    });
  }); // resuming parent state yielding from stored child state
  
  describe.skip('resuming parent state through synthesized state from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      // foo
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      // bar
      dispatcher.use('bar', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt();
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('baz', handler, { through: 'bar' }))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'baz', z: 3, parent: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .next(function(err) {
          console.log(err);
          done(err);
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        parent: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('baz bar(baz) foo(bar)');
    });
  }); // resuming parent state through synthesized state from stored child state
  
  describe.skip('resuming parent state yielding through synthesized state from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      // foo
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          req.state.y = req.yieldState.y;
          req.state.z = req.yieldState.z;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      // bar
      dispatcher.use('bar', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt();
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('baz', handler, { through: 'bar' }))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'baz', z: 3, parent: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .next(function(err) {
          console.log(err);
          done(err);
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1,
        y: undefined,
        z: undefined
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        parent: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('baz bar(baz) --bar/foo--> foo(bar)');
    });
  }); // resuming parent state yielding through synthesized state from stored child state
  
  describe.skip('resuming parent state yielding through synthesized state yielding from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      // foo
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          req.state.y = req.yieldState.y;
          req.state.z = req.yieldState.z;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      // bar
      dispatcher.use('bar', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt();
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt(err);
        }
      ]);
      
      dispatcher.transition('bar', 'baz', [
        function(req, res, next) {
          req.state.z = req.yieldState.z;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('baz', handler, { through: 'bar' }))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'baz', z: 3, parent: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .next(function(err) {
          console.log(err);
          done(err);
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1,
        y: undefined,
        z: 3
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        z: 3,
        parent: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('baz --baz/bar--> bar(baz) --bar/foo--> foo(bar)');
    });
  }); // resuming parent state yielding through synthesized state yielding from stored child state
  
  // THIS IS AN ERROR SOMEWHERE
  describe.skip('resuming parent state after transition through synthesized state from loaded, named state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [
        function(req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          res.__text += 'foo';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          res.__text += 'EFOO';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          req.state.y = req.yieldState.y;
          res.__text += ' --bar/foo--> ';
          next();
        },
        function(err, req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          res.__text += ' --EBAR/EFOO--> ';
          next();
        }
      ]);
      
      
      chai.express.handler(dispatcher.flow())
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'baz', z: 3, parent: '12345678' };
          request.session = { state: {} };
          request.session.state['12345678'] = { name: 'foo', x: 1 };
          request.session.state['22345678'] = { name: 'baz', z: 3, parent: '12345678' };
        })
        .res(function(res) {
          res.__text = 'bar'
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '12345678',
        name: 'foo',
        x: 1,
        y: 2
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        parent: '12345678'
      });
    });
    
    it('should remove state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          '12345678': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('bar --bar/foo--> foo');
    });
  }); // resuming parent state after transition through synthesized state from loaded, named state
  
});
