var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session')


describe('GET /login/federated', function() {
  
  it('should initialize state with referrer header and redirect with pushed state', function(done) {
    var store = new SessionStore({ genh: function() { return 'xyz' } });
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://client.example.com/login/federated',
        returnTo: 'https://client.example.com/login'
      });
      
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://client.example.com/cb');
      
      // TODO: Assert that the state hasn't changed after pushing
      
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com';
        req.headers = {
          'host': 'client.example.com',
          'referer': 'https://client.example.com/login'
        }
        req.connection = { encrypted: true };
        req.query = { provider: 'https://server.example.com' };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'https://server.example.com',
          returnTo: 'https://client.example.com/login'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://client.example.com/login'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
        done();
      })
      .listen();
  }); // should initialize state with referrer header and redirect with pushed state
  
  it('should initialize state with return to query parameter in preference to referrer header and redirect with pushed state', function(done) {
    var store = new SessionStore({ genh: function() { return 'xyz' } });
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://client.example.com/login/federated',
        returnTo: 'https://client.example.com/app'
      });
      
      res.pushState({
        provider: 'https://server.example.com'
      }, 'https://client.example.com/cb', false);
      
      // TODO: Assert that the state hasn't changed after pushing
      
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
    }

    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fclient.example.com/welcome';
        req.headers = {
          'host': 'client.example.com',
          'referer': 'https://client.example.com/login'
        }
        req.connection = { encrypted: true };
        req.query = { provider: 'https://server.example.com', return_to: 'https://client.example.com/app' };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'https://server.example.com',
          returnTo: 'https://client.example.com/app'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://client.example.com/app'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
        done();
      })
      .listen();
  }); // should initialize state with return to query parameter in preference to referrer header and redirect with pushed state
  
  it('should initialize state with state query parameter and redirect with pushed state', function(done) {
    var store = new SessionStore({ genh: function() { return 'xyz' } });
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/federated',
        resumeState: '00000000'
      });
      
      res.pushState({
        provider: 'https://server.example.net'
      }, 'https://server.example.com/cb', false);
      res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
    }

    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        // TODO: this shouldn't load the state, since it is not intended for the
        //        /login/federated resource, but rather /continue.   Need to handle
        //       this on push state, to set the resume state to the parent state.
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
        expect(store.load).to.have.callCount(1);
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          resumeState: '00000000'
        });
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
  }); // should initialize state with state query parameter and redirect with pushed state
  
  it('should push state with state query parameter in preference to return to query parameter and redirect with state', function(done) {
    var store = new SessionStore({ genh: function() { return 'xyz' } });
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.pushState({
        provider: 'https://server.example.net'
      }, 'https://server.example.com/cb', false);
      res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
    }

    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&return_to=https%3A%2F%2Fserver.example.com/welcome&state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login?state=00000000'
        }
        req.connection = { encrypted: true };
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
        expect(store.load).to.have.callCount(1);
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          resumeState: '00000000'
        });
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
  }); // should store state with state query parameter in preference to return to query parameter and redirect with state
  
});
