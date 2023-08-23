var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#render', function() {
  
  it('should render without state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      res.render('home');
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
        expect(this).to.render('home')
                    .with.deep.locals({});
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
  }); // should render without state
  
  it('should render without state due to ignoring invalid state parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      res.render('home');
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
        expect(this).to.render('home')
                    .with.deep.locals({});
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
  }); // should render without state due to ignoring invalid state parameter
  
  it('should render with URL that propagates referrer header', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/' });
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
  }); // should render with URL that propagates referrer header
  
  it('should render with URL that propagates query parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/welcome' });
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
  }); // should render with URL that propagates query parameter
  
  it('should render with URL that propagates body parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('stepup');
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
        expect(this).to.render('stepup')
                    .with.deep.locals({ returnTo: 'https://www.example.com/bienvenido' });
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
  }); // should render with URL that propagates body parameter
  
  it('should render with URL and state that propagates query parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: '123' });
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
  }); // should render with URL and state that propagates query parameters
  
  it('should render with URL and state that propagates body parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('stepup');
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
        expect(this).to.render('stepup')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: '123' });
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
  }); // should render with URL and state that propagates body parameters
  
  it('should render with URL and state that propagates body parameters when that state is not found in state store', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('stepup');
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
        expect(this).to.render('stepup')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: '123' });
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
  }); // should render with URL and state that propagates body parameters when that state is not found in state store
  
  it('should render with loaded state when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.locals.message = req.state.messages[0];
      res.locals.attemptsRemaining = 3 - req.state.failureCount;
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({
                      message: 'Invalid username or password.',
                      attemptsRemaining: 2,
                      state: '456'
                    });
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
  }); // should render with loaded state when processing a non-mutating request
  
  it('should render with loaded state after saving modifications when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.locals.message = req.state.messages[0];
      delete req.state.messages;
      res.locals.attemptsRemaining = 3 - req.state.failureCount;
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({
                      message: 'Invalid username or password.',
                      attemptsRemaining: 2,
                      state: '456'
                    });
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
  }); // should render with loaded state after saving modifications when processing a non-mutating request
  
  it('should render without state after completing state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('stepup');
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
        expect(this).to.render('stepup')
                    .with.deep.locals({});
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
  }); // should render without state after completing state when processing a mutating request
  
  it('should render with captured URL after completing current state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('stepup');
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
          returnTo: 'https://www.example.com/dashboard',
        };
      })
      .finish(function() {
        expect(this).to.render('stepup')
                    .with.deep.locals({ returnTo: 'https://www.example.com/dashboard' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/dashboard',
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should render with captured URL after completing current state when processing a mutating request
  
  it('should render with captured URL and state after completing current state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.render('stepup');
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
        expect(this).to.render('stepup')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: '123' });
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
  }); // should render with captured URL and state after completing current state when processing a mutating request
  
  it('should render with saved initial state when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.failureCount = 1;
      res.status(403);
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({ state: '456' });
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
  }); // should render with saved initial state when unsuccessfully processing a mutating request
  
  it('should render with loaded state when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.status(403);
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({ state: '456' });
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
  }); // should render with loaded state when unsuccessfully processing a mutating request
  
  it('should render with loaded state after saving modifications when unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      req.state.failureCount = req.state.failureCount + 1;
      res.status(403);
      res.render('login');
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
        expect(this).to.render('login')
                    .with.deep.locals({ state: '456' });
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
  }); // should render with loaded state after saving modifications when unsuccessfully processing a mutating request
  
});
