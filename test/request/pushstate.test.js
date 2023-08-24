var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('IncomingMessage#pushState', function() {
  
  it('should save pushed state without captured parameters and redirect to URL with pushed state handle', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb');
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com'
            }
          }
        });
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should save pushed state without captured parameters and redirect to URL with pushed state handle
  
  it('should save pushed state that captures referrer header and redirect to URL with pushed state handle', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb');
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          returnTo: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/'
            }
          }
        });
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should save pushed state that captures referrer header and redirect to URL with pushed state handle
  
  it('should redirect after saving pushed state that redirects to URL specified as query parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb');
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?return_to=https%3A%2F%2Fwww.example.com%2Fwelcome';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: 'https://www.example.com/welcome' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          returnTo: 'https://www.example.com/welcome'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/welcome'
            }
          }
        });
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect after saving pushed state that redirects to URL specified as query parameter
  
  // TODO: pull this out into state initiation tests?
  // TODO: ensure relative and aboslute urls are being handled correctly elsewhere.
  it('should redirect after saving pushed state that redirects to relative URL specified as query parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb');
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?return_to=%2Fwelcome';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: '/welcome' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          returnTo: '/welcome'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: '/welcome'
            }
          }
        });
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should redirect after saving pushed state that redirects to relative URL specified as query parameter
  
  it('should redirect after saving pushed state that redirects to URL with state specified as query parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb');
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
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
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
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
  }); // should redirect after saving pushed state that redirects to URL with state specified as query parameters
  
  it('should redirect after saving pushed state that redirects to URL propagated from current state when processing a non-mutating request that is optioned as mutating', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb');
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' }, mutationMethods: [ 'GET', 'POST' ] }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?state=123';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/login/federated',
          beep: 'boop',
          returnTo: 'https://www.example.com/dashboard'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          beep: 'boop',
          returnTo: 'https://www.example.com/dashboard'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/dashboard'
            }
          }
        });
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect after saving pushed state that redirects to URL propagated from current state when processing a non-mutating request that is optioned as mutating
  
  // TODO: test case same as above, but propagating state
  
  it('should redirect within callback after saving pushed state that redirects to URL with state specified as query parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb', function(err, h) {
        if (err) { return next(err); }
        expect(h).to.equal('xyz');
        res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=' + h);
      });
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
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
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
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
  }); // should redirect within callback after saving pushed state that redirects to URL with state specified as query parameters
  
  it('should redirect within callback after saving pushed state with explicit handle that redirects to URL with state specified as query parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://www.example.com/cb', { handle: 'oauth_xyz' }, function(err, h) {
        if (err) { return next(err); }
        expect(h).to.equal('oauth_xyz');
        res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=' + h);
      });
    }
  
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
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
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fwww.example.com%2Fcb&state=oauth_xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'oauth_xyz': {
              location: 'https://www.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/authorize/continue',
              state: '123'
            },
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
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
  }); // should redirect within callback after saving pushed state with explicit handle that redirects to URL with state specified as query parameters
  
  it('should push state linked to external location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        state: req.query.state
      }, '/authorize/continue');
      res.redirect('/login');
    }
  
    chai.express.use([ state({ external: true, store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fwww%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://www.example.com/cb' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/authorize',
          returnTo: 'https://www.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fwww%2Eexample%2Ecom%2Fcb'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should push state linked to external location
  
  it('should push and pop state linked to external location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        state: req.query.state
      }, '/authorize/continue');
      req.popState();
      req.state.complete();
      res.redirect('https://www.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz');
    }
  
    chai.express.use([ state({ external: true, store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fwww%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://www.example.com/cb' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://www.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/authorize',
          returnTo: 'https://www.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fwww%2Eexample%2Ecom%2Fcb'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        done();
      })
      .listen();
  }); // should push state linked to external location
  
});
