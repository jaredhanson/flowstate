var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/store/session')


describe('GET /login/federated', function() {
  
  it('should redirect with state to resume which then returns to referrer', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://client.example.com/login/federated',
        returnTo: 'https://client.example.com/login'
      });
      
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://client.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
    }
    
    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com';
        req.headers = {
          'host': 'client.example.com',
          'referer': 'https://client.example.com/login'
        };
        req.query = { provider: 'https://server.example.com' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/login/federated',
          returnTo: 'https://client.example.com/login'
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://client.example.com/login'
            }
          }
        });
        done();
      })
      .listen();
  }); // should redirect with state to resume which then returns to referrer
  
  it('should redirect with state to resume which then returns to "return_to" parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://client.example.com/login/federated',
        returnTo: 'https://client.example.com/app'
      });
      
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://client.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
    }

    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fclient.example.com/welcome';
        req.headers = {
          'host': 'client.example.com',
          'referer': 'https://client.example.com/login'
        };
        req.query = { provider: 'https://server.example.com', return_to: 'https://client.example.com/app' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/login/federated',
          returnTo: 'https://client.example.com/app'
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://client.example.com/app'
            }
          }
        });
        done();
      })
      .listen();
  }); // should redirect with state to resume which then returns to "return_to" parameter
  
  it('should redirect with state to resume which then resumes prior state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
      
      req.pushState({
        provider: 'https://server.example.net'
      }, 'https://server.example.com/cb');
      res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
    }

    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login?state=00000000'
        };
        req.query = { provider: 'https://server.example.net', state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/login/federated',
          resumeState: '00000000'
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=xyz');
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'xyz': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              resumeState: '00000000'
            }
          }
        });
        done();
      })
      .listen();
  }); // should redirect with state to resume which then resumes prior state
  
  it('should ignore "return_to" parameter and redirect with state to resume which then resumes prior state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
      
      req.pushState({
        provider: 'https://server.example.net'
      }, 'https://server.example.com/cb');
      res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
    }

    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&return_to=https%3A%2F%2Fserver.example.com/welcome&state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login?state=00000000'
        };
        req.query = { provider: 'https://server.example.net', return_to: 'https://server.example.com/welcome', state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/login/federated',
          resumeState: '00000000'
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=xyz');
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'xyz': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              resumeState: '00000000'
            }
          }
        });
        done();
      })
      .listen();
  }); // should ignore "return_to" parameter and redirect with state to resume which then resumes prior state
  
  it('should initialize state with state query parameter and redirect with saved pushed state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
      
      req.pushState({
        provider: 'https://server.example.net'
      }, 'https://server.example.com/cb', function(err, h) {
        if (err) { return next(err); }
        res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=' + h);
      });
      
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
    }

    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login?state=00000000'
        }
        req.connection = { encrypted: true };
        req.query = { provider: 'https://server.example.net', state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'xyz': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              resumeState: '00000000'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=xyz');
        done();
      })
      .listen();
  }); // should initialize state with state query parameter and redirect with saved pushed state
  
  it('should initialize state with state query parameter and redirect with saved pushed state using handle option', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
      
      req.pushState({
        provider: 'https://server.example.net'
      }, 'https://server.example.com/cb', { handle: 'oauth2:123' }, function(err, h) {
        if (err) { return next(err); }
        res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=' + h);
      });
      
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
    }

    chai.express.use([ state({ store: store, genh: function() { return 'xyz' } }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login?state=00000000'
        }
        req.connection = { encrypted: true };
        req.query = { provider: 'https://server.example.net', state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'oauth2:123': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              resumeState: '00000000'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=oauth2%3A123');
        done();
      })
      .listen();
  }); // should initialize state with state query parameter and redirect with saved pushed state using handle option
  
});
