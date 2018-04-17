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
    
    describe('from grandparent state of current state', function() {
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
            request.session.state['H0'] = { name: 'start' };
            request.session.state['H1'] = { name: 'login', parent: 'H0' };
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
        expect(response.__track).to.equal('federate login(federate) start(login)[F]');
      });
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(3);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.load.getCall(1);
        expect(call.args[1]).to.equal('H1');
        var call = dispatcher._store.load.getCall(2);
        expect(call.args[1]).to.equal('H0');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(0);
      
        expect(dispatcher._store.destroy).to.have.callCount(3);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.destroy.getCall(1);
        expect(call.args[1]).to.equal('H1');
        var call = dispatcher._store.destroy.getCall(2);
        expect(call.args[1]).to.equal('H0');
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.be.null;
        expect(request.state).to.deep.equal({
          name: 'start'
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.null;
        expect(request.yieldState).to.deep.equal({
          name: 'login',
          parent: 'H0'
        });
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from grandparent state of current state
    
    describe('from grandparent state of current state where parent state requests state be kept', function() {
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
            req.state.keep();
            next();
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
          next(new Error('access denied'));
        }
      
      
        chai.express.handler(dispatcher.flow('federate', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H0'] = { name: 'start' };
            request.session.state['H1'] = { name: 'login', parent: 'H0' };
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
        expect(response.__track).to.equal('federate E:login(federate) start(login)[F]');
      });
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(3);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.load.getCall(1);
        expect(call.args[1]).to.equal('H1');
        var call = dispatcher._store.load.getCall(2);
        expect(call.args[1]).to.equal('H0');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
      
        expect(dispatcher._store.destroy).to.have.callCount(3);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H2');
        var call = dispatcher._store.destroy.getCall(1);
        expect(call.args[1]).to.equal('H1');
        var call = dispatcher._store.destroy.getCall(2);
        expect(call.args[1]).to.equal('H0');
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.be.null;
        expect(request.state).to.deep.equal({
          name: 'start'
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.null;
        expect(request.yieldState).to.deep.equal({
          name: 'login',
          parent: 'H0'
        });
      });
    
      it('should remove completed state from session, including kept state because it has a parent state', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from grandparent state of current state where parent state requests state be kept
    
    describe('from current state yeilding results to parent state', function() {
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
        
        dispatcher.yield('login', 'federate', [
          function(req, res, next) {
            res.__track += ' <' + req.yieldState.name + '>';
            req.state.issuer = req.yieldState.issuer;
            next();
          },
          function(err, req, res, next) {
            res.__track += ' <E:' + req.yieldState.name + '>';
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          req.state.issuer = 'https://id.example.com';
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
        expect(response.__track).to.equal('federate <federate> login(federate)[F]');
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
          name: 'login',
          issuer: 'https://id.example.com'
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.null;
        expect(request.yieldState).to.deep.equal({
          name: 'federate',
          verifier: 'secret',
          parent: 'H1',
          issuer: 'https://id.example.com'
        });
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // from current state yeilding results to parent state
    
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
    
    describe('from current state yielding results through synthesized state', function() {
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
        
        dispatcher.yield('login', 'federate', [
          function(req, res, next) {
            res.__track += ' <' + req.yieldState.name + '>';
            req.state.issuer = req.yieldState.issuer;
            next();
          },
          function(err, req, res, next) {
            res.__track += ' <E:' + req.yieldState.name + '>';
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          req.state.issuer = 'https://id.example.com';
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
        expect(response.__track).to.equal('federate <federate> login(federate)[F]');
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
          name: 'login',
          issuer: 'https://id.example.com'
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.null;
        expect(request.yieldState).to.deep.equal({
          name: 'federate',
          verifier: 'secret',
          issuer: 'https://id.example.com'
        });
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // from current state yielding results through synthesized state
    
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
    
    describe('from new state yielding to state referenced by query param', function() {
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
    }); // from new state yielding to state referenced by query param
    
    describe('from new state yielding to state referenced by custom query param', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from new state yielding to state referenced by custom query param
    
    describe('from new state through synthesized state', function() {
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
    
      it('should not persist completed state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // from new state through synthesized state
    
    describe('from new state yielding to state referenced by query param through synthesized state', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from new state yielding to state referenced by query param through synthesized state
    
    describe('from new state yielding with results to state referenced by query param through synthesized state', function() {
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
        
        dispatcher.yield('login', 'federate', [
          function(req, res, next) {
            res.__track += ' <' + req.yieldState.name + '>';
            req.state.issuer = req.yieldState.issuer;
            next();
          },
          function(err, req, res, next) {
            res.__track += ' <E:' + req.yieldState.name + '>';
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          req.state.issuer = 'https://id.example.com'
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
        expect(response.__track).to.equal('federate <federate> login(federate) start(login)[F]');
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
          parent: 'H1',
          issuer: 'https://id.example.com'
        });
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from new state yielding with results to state referenced by query param through synthesized state
    
    describe('from new state yielding with results to state referenced by query param through synthesized state that also yields results', function() {
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
            req.state.confidence = 0.5;
            next();
          },
          function(err, req, res, next) {
            res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
            next(err);
          }
        ]);
        
        dispatcher.yield('start', 'login', [
          function(req, res, next) {
            res.__track += ' <' + req.yieldState.name + '>';
            req.state.issuer = req.yieldState.issuer;
            req.state.confidence = req.yieldState.confidence * 100;
            next();
          },
          function(err, req, res, next) {
            res.__track += ' <E:' + req.yieldState.name + '>';
            next(err);
          }
        ]);
        
        dispatcher.yield('login', 'federate', [
          function(req, res, next) {
            res.__track += ' <' + req.yieldState.name + '>';
            req.state.issuer = req.yieldState.issuer;
            next();
          },
          function(err, req, res, next) {
            res.__track += ' <E:' + req.yieldState.name + '>';
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          req.state.issuer = 'https://id.example.com'
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
        expect(response.__track).to.equal('federate <federate> login(federate) <login> start(login)[F]');
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
          foo: 'bar',
          issuer: 'https://id.example.com',
          confidence: 50
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.undefined;
        expect(request.yieldState).to.deep.equal({
          name: 'login',
          parent: 'H1',
          issuer: 'https://id.example.com',
          confidence: 0.5
        });
      });
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from new state yielding with results to state referenced by query param through synthesized state that also yields results
    
    describe('from new state yielding to state referenced by query param through unsynthesized state', function() {
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
    
      it('should remove completed state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start');
      });
    }); // from new state yielding to state referenced by query param through unsynthesized state
    
  }); // finish by redirecting
  
  
  describe('finish by rendering', function() {
    
    describe('with error from new state yeilding to state referenced by body param which keeps state', function() {
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
            next();
          },
          function(err, req, res, next) {
            res.__track += '[E]';
            res.locals.message = err.message;
            res.render('views/' + req.state.name);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('invalid credentials'));
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
    
      it('should maintain state in session', function() {
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
          message: 'invalid credentials',
          state: 'H1'
        });
      });
    }); // with error from new state yeilding to state referenced by body param which keeps state
    
    describe('with error from new state yeilding to state referenced by body param which keeps state without modification', function() {
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
            req.state.keep();
            next(err);
          }
        ], [
          function(req, res, next) {
            res.__track += '[F]';
            next();
          },
          function(err, req, res, next) {
            res.__track += '[E]';
            res.locals.message = err.message;
            res.render('views/' + req.state.name);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('invalid credentials'));
        }
      
      
        chai.express.handler(dispatcher.flow('authenticate', handler))
          .req(function(req) {
            request = req;
            request.body = { state: 'H1' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'login', failure: true };
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
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.equal('H1');
        expect(request.state).to.deep.equal({
          name: 'login',
          failure: true
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.undefined;
        expect(request.yieldState).to.deep.equal({
          name: 'authenticate'
        });
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'login',
              failure: true
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          message: 'invalid credentials',
          state: 'H1'
        });
      });
    }); // with error from new state yeilding to state referenced by body param which keeps state without modification
    
    describe('with error from new state through synthesized state', function() {
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
            res.locals.message = err.message;
            res.render('views/' + req.state.name);
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          message: 'something went wrong'
        });
      });
    }); // with error from new state through synthesized state
    
    describe('with error from new state through synthesized state which keeps state', function() {
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
            req.state.keep();
            next(err);
          }
        ], [
          function(req, res, next) {
            res.__track += '[F]';
            next();
          },
          function(err, req, res, next) {
            res.__track += '[E]';
            res.locals.message = err.message;
            res.render('views/' + req.state.name);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('invalid credentials'));
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
    
      it('should maintain state in session', function() {
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
          message: 'invalid credentials',
          state: 'H1'
        });
      });
    }); // with error from new state through synthesized state which keeps state
    
    describe('with error from new state through synthesized state which keeps state without modification', function() {
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
            req.state.keep();
            next(err);
          }
        ], [
          function(req, res, next) {
            res.__track += '[F]';
            next();
          },
          function(err, req, res, next) {
            res.__track += '[E]';
            res.locals.message = err.message;
            res.render('views/' + req.state.name);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('invalid credentials'));
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
        expect(dispatcher._store.save).to.have.callCount(1);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.equal('H1');
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'login'
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          message: 'invalid credentials',
          state: 'H1'
        });
      });
    }); // with error from new state through synthesized state which keeps state without modification
    
  }); // finish by rendering
  
  
  describe('continue by rendering', function() {
    
    describe('with error from new state yeilding to state referenced by body param which modifies state', function() {
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
            next();
          },
          function(err, req, res, next) {
            res.__track += '[E]';
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('invalid credentials'));
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
    
      it('should maintain state in session', function() {
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
          message: 'invalid credentials',
          state: 'H1'
        });
      });
    }); // with error from new state yeilding to state referenced by body param which modifies state
    
    describe('with error from new state through synthesized state which modifies state', function() {
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
            next();
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
    
      it('should maintain state in session', function() {
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
    }); // with error from new state through synthesized state which modifies state
    
  }); // continue by rendering
  
  
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
          parent: 'H1'
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({ state: {} });
      });
    }); // due to state referenced by query param not found
    
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
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state.handle).to.equal('H1');
        expect(request.state).to.deep.equal({ name: 'login' });
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
          'H1': { name: 'login' }
        } });
      });
    }); // due to state not being registered
    
    describe('due to state not being resumable', function() {
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
        dispatcher.use('login', [
          function(req, res, next) {
          },
          function(err, req, res, next) {
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
        expect(err.message).to.equal("Unable to resume state 'login'");
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
        expect(request.state).to.deep.equal({ name: 'login' });
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
          'H1': { name: 'login' }
        } });
      });
    }); // due to state not being resumable
    
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
    
    describe('encountered while saving state kept after resuming state referenced by query param', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.stub(dispatcher._store, 'update').yields(new Error('something went wrong saving state'));
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        dispatcher.use('login', null, [
          function(req, res, next) {
            res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
            req.state.ok = true;
            req.state.keep();
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
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next();
        }
      
      
        chai.express.handler(dispatcher.flow('authenticate', handler))
          .req(function(req) {
            request = req;
            request.body = { state: 'H1' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'login', failureCount: 2 };
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
        expect(err.message).to.equal('something went wrong saving state');
      });
    
      it('should track correctly', function() {
        expect(response.__track).to.equal('authenticate login(authenticate)[E]');
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
          failureCount: 2,
          ok: true
        });
      });
    
      it('should set yieldState', function() {
        expect(request.yieldState).to.be.an('object');
        expect(request.yieldState.handle).to.be.undefined;
        expect(request.yieldState).to.deep.equal({
          name: 'authenticate'
        });
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'login',
              failureCount: 2
            }
          }
        });
      });
    }); // encountered while saving state kept after resuming state referenced by query param
    
    describe('encountered while saving state kept after resuming state referenced by query param with error', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.stub(dispatcher._store, 'update').yields(new Error('something went wrong saving state'));
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
            next();
          },
          function(err, req, res, next) {
            res.__track += '[E]';
            next(err);
          }
        ]);
      
        function handler(req, res, next) {
          res.__track = req.state.name;
          next(new Error('invalid credentials'));
        }
      
      
        chai.express.handler(dispatcher.flow('authenticate', handler))
          .req(function(req) {
            request = req;
            request.body = { state: 'H1' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'login', failureCount: 2 };
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
        expect(err.message).to.equal('something went wrong saving state');
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
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'login',
              failureCount: 2
            }
          }
        });
      });
    }); // encountered while saving state kept after resuming state referenced by query param with error
    
    // TODO: Resume through to a synthentic state and keep it, failing with error (and success cases)
    
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
