var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#render', function() {
  
  it('should render without state', function(done) {
    var store = new SessionStore();
    
    function handler(req, res, next) {
      res.render('home')
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
        done();
      })
      .listen();
  }); // should render without state
  
  it('should render with redirect URL set to referrer', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
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
        done();
      })
      .listen();
  }); // should render with redirect URL set to referrer
  
  it('should render with redirect URL set to URL specified by query parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
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
        done();
      })
      .listen();
  }); // should render with redirect URL set to URL specified by query parameter
  
  it('should render with redirect URL set to URL specified by body parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.status(403);
      res.render('login')
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
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/bienvenido' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/bienvenido'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with redirect URL set to URL specified by query parameter
  
  it('should render with redirect URL and state as specified by query parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/dashboard'
        };
        req.query = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/dashboard/cb',
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with redirect URL and state as specified by query parameter
  
  it('should render with redirect URL and state as specified by body parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.status(403);
      res.render('login')
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
          redirectURI: 'https://www.example.com/dashboard/cb',
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with returnTo URL and state as specified by body parameter
  
  it('should render with redirect URL and state when that state is not found in state store', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.status(403);
      res.render('login')
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
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: 'xxx' };
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: 'xxx' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: 'xxx'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with redirect URL and state when that state is not found in state store
  
  it('should render with current state on non-mutating request', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.locals.message = req.state.messages[0];
      res.locals.attemptsRemaining = 3 - req.state.failureCount;
      res.render('login')
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
          redirectURI: 'https://www.example.com/dashboard/cb',
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with current state on non-mutating request
  
  // FIXME: make this pass
  it.skip('should render with current state after saving modifications on non-mutating request', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.locals.message = req.state.messages[0];
      res.locals.attemptsRemaining = 3 - req.state.failureCount;
      delete req.state.messages;
      res.render('login')
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
          redirectURI: 'https://www.example.com/dashboard/cb',
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with current state after saving modifications on non-mutating request
  
  it('should render with state to resume on successfully processing a mutating request', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('token')
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
        expect(this).to.render('token')
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with state to resume on successfully processing a mutating request
  
  it('should render with current state on unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.status(403);
      res.render('login')
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with current state on unsuccessfully processing a mutating request
  
  // FIXME: make this pass
  it.skip('should render with current state after saving modifications on unsuccessfully processing a mutating request', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      req.state.failureCount = req.state.failureCount + 1;
      res.status(403);
      res.render('login')
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
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should render with current state after saving modifications on unsuccessfully processing a mutating request
  
});
