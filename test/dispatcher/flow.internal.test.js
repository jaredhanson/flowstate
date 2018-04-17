var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (internally-driven)', function() {
  
  describe('rendering', function() {
  
    describe('without any state', function() {
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
        function handler(req, res, next) {
          res.render('views/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({});
      });
    }); // without any state
    
    describe('without any state in final handler', function() {
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
        function handler(req, res, next) {
          next();
        }
      
        function finalHandler(req, res, next) {
          res.render('views/final/' + req.state.name);
        }
      
      
        chai.express.handler([dispatcher.flow('login', handler), finalHandler])
          .req(function(req) {
            request = req;
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/final/login');
        expect(response.locals).to.deep.equal({});
      });
    }); // without any state in final handler
    
    describe('without any state in final error handler', function() {
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
        function handler(req, res, next) {
          next(new Error('something went wrong'));
        }
      
        function errorHandler(err, req, res, next) {
          next(err);
        }
      
        function finalHandler(req, res, next) {
          res.render('views/final/' + req.state.name);
        }
      
        function finalErrorHandler(err, req, res, next) {
          res.locals.message = err.message;
          res.render('views/final/' + req.state.name);
        }
      
      
        chai.express.handler([dispatcher.flow('login', handler, errorHandler), finalHandler, finalErrorHandler])
          .req(function(req) {
            request = req;
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/final/login');
        expect(response.locals).to.deep.equal({ message: 'something went wrong' });
      });
    }); // without any state in final error handler
    
    describe('from new state yielding to state from query param', function() {
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
        function handler(req, res, next) {
          res.render('views/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H1' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'start', foo: 'bar' };
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
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should set optimized parent state', function() {
        expect(request._state).to.be.an('object');
        expect(request._state).to.deep.equal({
          name: 'start',
          foo: 'bar'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          state: 'H1'
        });
      });
    }); // from new state yielding to state from query param
    
    describe('from new state yielding to state from body param', function() {
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
        function handler(req, res, next) {
          res.render('views/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
            request.body = { state: 'H1' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'start', foo: 'bar' };
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
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should set optimized parent state', function() {
        expect(request._state).to.be.an('object');
        expect(request._state).to.deep.equal({
          name: 'start',
          foo: 'bar'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          state: 'H1'
        });
      });
    }); // from new state yielding to state from body param
    
    describe('from current state carried in query param', function() {
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
        function handler(req, res, next) {
          res.locals.attemptsRemaining = 3 - req.state.failureCount;
          res.render('views/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'start', foo: 'bar' };
            request.session.state['H2'] = { name: 'login', failureCount: 2 };
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login',
          failureCount: 2
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            },
            'H2': {
              name: 'login',
              failureCount: 2
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          attemptsRemaining: 1,
          state: 'H2'
        });
      });
    }); // from current state carried in query param
    
    describe('from current state carried in body param', function() {
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
        function handler(req, res, next) {
          res.locals.attemptsRemaining = 3 - req.state.failureCount;
          res.render('views/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
            request.body = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'start', foo: 'bar' };
            request.session.state['H2'] = { name: 'login', failureCount: 2 };
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login',
          failureCount: 2
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            },
            'H2': {
              name: 'login',
              failureCount: 2
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          attemptsRemaining: 1,
          state: 'H2'
        });
      });
    }); // from current state carried in body param
    
    describe('from current state carried in custom query param', function() {
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
        function handler(req, res, next) {
          res.locals.attemptsRemaining = 3 - req.state.failureCount;
          res.render('views/' + req.state.name);
        }
      
      
        function getHandle(req) {
          return req.query.s;
        }
      
        chai.express.handler(dispatcher.flow('login', handler, { getHandle: getHandle }))
          .req(function(req) {
            request = req;
            request.query = { s: 'H2' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'start', foo: 'bar' };
            request.session.state['H2'] = { name: 'login', failureCount: 2 };
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login',
          failureCount: 2
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            },
            'H2': {
              name: 'login',
              failureCount: 2
            }
          }
        });
      });
    
      it('should render layout', function() {
        expect(layout).to.equal('views/login');
        expect(response.locals).to.deep.equal({
          attemptsRemaining: 1,
          state: 'H2'
        });
      });
    }); // rendering from a current state where state is carried in custom query param
  
  }); // rendering
  
  describe('redirecting', function() {
    
    describe('without any state', function() {
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
        function handler(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login');
      });
    }); // without any state
    
    describe('from new state yielding to state from query param', function() {
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
        function handler(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
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
        expect(request.state).to.deep.equal({
          name: 'login'
        });
      });
    
      it('should set optimized parent state', function() {
        expect(request._state).to.be.an('object');
        expect(request._state).to.deep.equal({
          name: 'start',
          foo: 'bar'
        });
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            }
          }
        });
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login?state=H1');
      });
    }); // from new state yielding to state from query param
    
    describe('from current state carried in query param', function() {
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
        function handler(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      
      
        chai.express.handler(dispatcher.flow('login', handler))
          .req(function(req) {
            request = req;
            request.query = { state: 'H2' };
            request.session = { state: {} };
            request.session.state['H1'] = { name: 'start', foo: 'bar' };
            request.session.state['H2'] = { name: 'login', failureCount: 2 };
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
    
    
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        var call = dispatcher._store.load.getCall(0);
        expect(call.args[1]).to.equal('H2');
      
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'login',
          failureCount: 2
        });
      });
    
      it('should not set optimized parent state', function() {
        expect(request._state).to.be.undefined;
      });
    
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
    
      it('should maintain state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              foo: 'bar'
            },
            'H2': {
              name: 'login',
              failureCount: 2
            }
          }
        });
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/login?state=H2');
      });
    }); // from current state carried in query param
    
  }); // redirecting
  
  
  describe('failure', function() {
    
    // TODO: required state not found
    
  }); // failure
  
});
