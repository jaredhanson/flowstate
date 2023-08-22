var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#redirect', function() {
  
  it('should redirect without state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      res.redirect('/home');
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/home');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect without state
  
  it('should redirect with redirect URL that propagates referrer header', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/login/password');
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?return_to=https%3A%2F%2Fwww.example.com%2F');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL that propagates referrer header
  
  it('should redirect with redirect URL that propagates query parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/login/password');
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fwelcome';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: 'https://www.example.com/welcome' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?return_to=https%3A%2F%2Fwww.example.com%2Fwelcome');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/welcome'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL that propagates query parameter
  
  it('should redirect with redirect URL that propagates body parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/stepup');
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.body = { return_to: 'https://www.example.com/bienvenido' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/stepup?return_to=https%3A%2F%2Fwww.example.com%2Fbienvenido');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/bienvenido'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL that propagates body parameter
  
  it('should redirect with redirect URL and state that propagates query parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/login/password');
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL and state that propagates query parameters
  
  it('should redirect with redirect URL and state that propagates body parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/stepup');
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/stepup?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL and state that propagates body parameters
  
  it('should redirect with propagated body parameters as redirect URL with state when that state is not found in state store', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/stepup')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/stepup?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with propagated body parameters as redirect URL with state when that state is not found in state store
  
  it('should redirect with current URL and modified initial state when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.riskScore = 0.82;
      res.redirect('/captcha')
    }
  
    chai.express.use([ state({ store: store, genh: function() { return '456' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.query = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/captcha?return_to=https%3A%2F%2Fwww.example.com%2Flogin&state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          riskScore: 0.82,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              riskScore: 0.82,
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current URL and modified initial state when processing a non-mutating request
  
  it('should redirect with current URL and state when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/captcha')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?state=456';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.query = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/captcha?return_to=https%3A%2F%2Fwww.example.com%2Flogin&state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              messages: [ 'Invalid username or password.' ],
              failureCount: 1,
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current URL and state when processing a non-mutating request
  
  it('should redirect with current URL and state after saving modifications when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.riskScore = 0.82;
      res.redirect('/captcha')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?state=456';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.query = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/captcha?return_to=https%3A%2F%2Fwww.example.com%2Flogin&state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          riskScore: 0.82,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              messages: [ 'Invalid username or password.' ],
              failureCount: 1,
              riskScore: 0.82,
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current URL and state after saving modifications when processing a non-mutating request
  
  it('should redirect without state after completing current state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/stepup')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          failureCount: 1
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/stepup');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 1
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect with out state after completing current state when processing a mutating request
  
  it('should redirect with redirect URL after completing current state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/stepup')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/dashboard'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/stepup?return_to=https%3A%2F%2Fwww.example.com%2Fdashboard');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/dashboard'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL after completing current state when processing a mutating request
  
  it('should redirect with redirect URL and state after completing current state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.redirect('/stepup')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/stepup?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL and state after completing current state when processing a mutating request
  
  it('should redirect with modified initial state when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.failureCount = 1;
      req.state.complete(false);
      res.redirect('/login')
    }
  
    chai.express.use([ state({ store: store, genh: function() { return '456' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login?state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              failureCount: 1,
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current state when unsuccessfully processing a mutating request
  
  it('should redirect with current state when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.complete(false);
      res.redirect('/login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login?state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current state when unsuccessfully processing a mutating request
  
  it('should redirect with current state after saving modifications when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.failureCount = req.state.failureCount + 1;
      req.state.complete(false);
      res.redirect('/login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/dashboard/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login?state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 2,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              failureCount: 2,
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current state after saving modifications when unsuccessfully processing a mutating request
  
  it('should redirect with current URL and state when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.complete(false);
      res.redirect('/captcha')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/captcha?return_to=https%3A%2F%2Fwww.example.com%2Flogin&state=456');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '456': {
              location: 'https://www.example.com/login',
              messages: [ 'Invalid username or password.' ],
              failureCount: 1,
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect with current URL and state when unsuccessfully processing a mutating request
  
  it('should ignore invalid state parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = { state: 'xxx' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/home');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should ignore invalid state parameter
  
});
