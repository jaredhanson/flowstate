var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow', function() {
  
  describe('immediately completing an externally initiated flow by redirecting', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.redirect('/from/' + req.state.name);
      }
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'start'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // immediately completing an externally initiated flow by redirecting
  
  describe('prompting via redirect from an externally initiated flow', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.prompt('consent');
      }
      
      dispatcher.use('consent', [
        function(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start'
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
    });
  }); // prompting via redirect from an externally initiated flow
  
  describe('prompting via redirect from an externally initiated flow with changed state', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        req.state.x = 1;
        res.prompt('consent');
      }
      
      dispatcher.use('consent', [
        function(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
    });
  }); // prompting via redirect from an externally initiated flow with changed state
  
  describe('prompting via redirect with parameters from an externally initiated flow', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.prompt('consent', { to: 'test' });
      }
      
      dispatcher.use('consent', [
        function(req, res, next) {
          res.redirect('/from/' + req.state.name + '?to=' + req.locals.to);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({
        to: 'test'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start'
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/consent?to=test&state=H1');
    });
  }); // prompting via redirect with parameters from an externally initiated flow
  
  describe('prompting via redirect from an externally initiated flow that explicity saved state', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        req.state.x = 1;
        req.state.save(function(err) {
          if (err) { return next(err); }
          res.prompt('consent');
        });
      }
      
      dispatcher.use('consent', [
        function(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
      expect(dispatcher._store.update).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
    });
  }); // prompting via redirect from an externally initiated flow
  
  describe('prompting via redirect with changed state from an externally initiated flow', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.prompt('federate');
      }
      
      dispatcher.use('federate', [
        function(req, res, next) {
          req.state.verifier = 'secret';
          res.redirect('/from/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(2);
    });
    
    it('should set state', function() {
      //expect(request.state.initiatedAt).to.be.a('number')
      //delete request.state.initiatedAt;
      
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'federate',
        prev: 'H1',
        verifier: 'secret'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      //expect(request.session.state['H2'].initiatedAt).to.be.a('number')
      //delete request.session.state['H2'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start'
          },
          'H2': {
            name: 'federate',
            prev: 'H1',
            verifier: 'secret'
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/federate?state=H2');
    });
  }); // prompting via redirect with changed state from an externally initiated flow
  
  describe('prompting via redirect with required state from an externally initiated flow', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.prompt('finish');
      }
      
      dispatcher.use('finish', [
        function(req, res, next) {
          req.state.required();
          res.redirect('/from/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = {};
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(2);
    });
    
    it('should set state', function() {
      //expect(request.state.initiatedAt).to.be.a('number')
      //delete request.state.initiatedAt;
      
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'finish',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      //expect(request.session.state['H2'].initiatedAt).to.be.a('number')
      //delete request.session.state['H2'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start'
          },
          'H2': {
            name: 'finish',
            prev: 'H1'
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/finish?state=H2');
    });
  }); // prompting via redirect with required state from an externally initiated flow
  
  describe('prompting via render from an externally initiated flow', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.prompt('consent');
      }
      
      dispatcher.use('consent', [
        function(req, res, next) {
          res.render('views/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({});
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start'
          }
        }
      });
    });
    
    it('should render layout', function() {
      expect(layout).to.equal('views/consent');
      expect(response.locals).to.deep.equal({
        state: 'X1'
      });
    });
  }); // prompting via render from an externally initiated flow
  
  describe('prompting via render with parameters from an externally initiated flow', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.prompt('consent', { to: 'test' });
      }
      
      dispatcher.use('consent', [
        function(req, res, next) {
          res.locals.to = req.locals.to;
          res.render('views/' + req.state.name);
        }
      ], null);
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
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
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(1);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        name: 'consent',
        prev: 'H1'
      });
    });
    
    it('should set locals', function() {
      expect(request.locals).to.deep.equal({
        to: 'test'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should persist state in session', function() {
      //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
      //delete request.session.state['H1'].initiatedAt;
      
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'start'
          }
        }
      });
    });
    
    it('should render layout', function() {
      expect(layout).to.equal('views/consent');
      expect(response.locals).to.deep.equal({
        to: 'test',
        state: 'X1'
      });
    });
  }); // prompting via render with parameters from an externally initiated flow
  
  
  
  
  /***/
  
  describe('prompting via render from a new state without parent state', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
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
  }); // prompting via render from a new state without parent state
  
  describe('prompting via render from a new state where parent state is carried in query param', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.locals.identifierHint = 'alice@example.com';
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
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
        identifierHint: 'alice@example.com',
        state: 'H1'
      });
    });
  }); // prompting via render from a new state where parent state is carried in query param
  
  describe('prompting via render from a current state where state is carried in query param', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, layout, err;
      
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
    });
      
    before(function(done) {
      function handler(req, res, next) {
        res.locals.identifierHint = 'alice@example.com';
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
    });
    
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H2');
      
      expect(dispatcher._store.save).to.have.callCount(0);
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
        identifierHint: 'alice@example.com',
        state: 'H2'
      });
    });
  }); // prompting via render from a current state where state is carried in query param
  
  
  
  
  /***/
  
  describe('resuming parent state referenced by query param which finishes by redirecting', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('start', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          console.log(err);
          //res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          console.log(err);
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
      dispatcher._store.destroy.restore();
    });
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('consent start(consent)[F]');
    });
    
    // FIXME: double destroy
    it.skip('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
      call = dispatcher._store.destroy.getCall(1);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
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
  
  describe('resuming parent state referenced by query param through synthesized state which finishes by redirecting', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('start', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          console.log(err);
          //res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          console.log(err);
        }
      ]);
      
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          console.log(err);
          //res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
      dispatcher._store.destroy.restore();
    });
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('federate login(federate) start(login)[F]');
    });
    
    // FIXME: double destroy
    it.skip('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
      call = dispatcher._store.destroy.getCall(1);
      expect(call.args[1]).to.equal('H1');
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
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
        prev: 'H1'
      });
    });
    
    it('should remove completed parent state from session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // resuming parent state referenced by query param through synthesized state which finishes by redirecting
  
  describe('resuming synthesized state which finishes by redirecting', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
      dispatcher._store.destroy.restore();
    });
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate login(authenticate)[F]');
    });
    
    // FIXME: double destroy
    it.skip('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
      call = dispatcher._store.destroy.getCall(1);
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
  
  describe('resuming with error a synthesized state which finishes by rendering', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, err;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
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
    
    // FIXME: double destroy
    it.skip('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
      call = dispatcher._store.destroy.getCall(1);
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
  }); // resuming with error a synthesized state which finishes by rendering
  
  describe('resuming with error a synthesized state which continues with error', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, error;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
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
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
      dispatcher._store.destroy.restore();
    });
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)[E]/E');
    });
    
    // FIXME: double destroy
    it.skip('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      var call = dispatcher._store.load.getCall(0);
      expect(call.args[1]).to.equal('H1');
      
      expect(dispatcher._store.save).to.have.callCount(0);
      
      expect(dispatcher._store.destroy).to.have.callCount(2);
      call = dispatcher._store.destroy.getCall(0);
      expect(call.args[1]).to.equal('H1');
      call = dispatcher._store.destroy.getCall(1);
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
  }); // resuming with error a synthesized state which finishes by rendering
  
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
          request.session.state['H2'] = { name: 'bar', y: 2, prev: 'H1' };
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
        prev: 'H1'
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
          request.session.state['H2'] = { name: 'bar', y: 2, prev: 'H1' };
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
        prev: 'H1'
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
          request.session.state['H2'] = { name: 'baz', z: 3, prev: 'H1' };
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
        prev: 'H1'
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
          request.session.state['H2'] = { name: 'baz', z: 3, prev: 'H1' };
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
        prev: 'H1'
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
          request.session.state['H2'] = { name: 'baz', z: 3, prev: 'H1' };
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
        prev: 'H1'
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
          request.state = { handle: '22345678', name: 'baz', z: 3, prev: '12345678' };
          request.session = { state: {} };
          request.session.state['12345678'] = { name: 'foo', x: 1 };
          request.session.state['22345678'] = { name: 'baz', z: 3, prev: '12345678' };
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
        prev: '12345678'
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
