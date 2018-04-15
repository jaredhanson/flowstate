var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (resume)', function() {
  
  describe('finish by redirecting', function() {
    
    describe('from current state carried in query param', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // from current state carried in query param
    
    describe('from current state carried in custom query param', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // from current state carried in custom query param
    
    describe('from current state through synthesized state', function() {
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
      
      
        chai.express.handler(dispatcher.flow('federate', handler, { through: 'login' }))
          .req(function(req) {
            request = req;
            request.query = { state: 'H1' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'federate', verifier: 'secret' };
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
        expect(dispatcher._store.load).to.have.callCount(1);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H1');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(0);
      
        expect(dispatcher._store.destroy).to.have.callCount(1);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H1');
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
        expect(request.yieldState.handle).to.be.null;
        expect(request.yieldState).to.deep.equal({
          name: 'federate',
          verifier: 'secret'
        });
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // from current state through synthesized state
    
    describe('with error from current state', function() {
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
            res.redirect('/from/' + req.state.name + '?message=' + err.message);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('cancel'));
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login?message=cancel');
      });
    }); // with error from current state
    
    describe('to parent state referenced by query param', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // to parent state referenced by query param
    
  }); // finish by redirecting
  
  
  describe('failure', function() {
    
    describe('due to state not found', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    }); // due to state not found
    
    describe('due to state not found after error', function() {
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
          parent: 'H1'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    }); // due to state not found after error
    
    describe('due to parent state being unnamed', function() {
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
            request.session.state['H1'] = { foo: 'bar' };
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
        expect(request.state).to.deep.equal({ foo: 'bar' });
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { foo: 'bar' }
        } });
      });
    }); // due to parent state being unnamed
    
    describe('due to parent state being unnamed after error', function() {
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
            request.session.state['H1'] = { foo: 'bar' };
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
        expect(request.state).to.deep.equal({ foo: 'bar' });
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { foo: 'bar' }
        } });
      });
    }); // due to parent state being unnamed after error
    
    describe('encountered while destroying current state', function() {
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { name: 'login' },
          'H2': { name: 'federate', verifier: 'secret', parent: 'H1' }
        } });
      });
    }); // encountered while destroying current state
    
    describe('encountered while destroying current state after error', function() {
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
    
    
      it('should preserve error', function() {
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { name: 'login' },
          'H2': { name: 'federate', verifier: 'secret', parent: 'H1' }
        } });
      });
    }); // encountered while destroying current state after error
    
    describe('encountered while loading parent state', function() {
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { name: 'login' }
        } });
      });
    }); // encountered while loading parent state
    
    describe('encountered while loading parent state after error', function() {
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
    
    
      it('should preserve error', function() {
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {
          'H1': { name: 'login' }
        } });
      });
    }); // encountered while loading parent state after error
    
  }); // failure
  
});
