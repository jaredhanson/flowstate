var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('GET /login', function() {
    
  it('should initialize state without properties and redirect without any state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login'
      });
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com'
        }
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password');
        done();
      })
      .listen();
  }); // should initialize state without properties and redirect without any state
  
  it('should initialize state with referrer header and redirect with return location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login',
        returnTo: 'https://www.example.com/'
      });
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        }
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?return_to=https%3A%2F%2Fwww.example.com%2F');
        done();
      })
      .listen();
  }); // sshould initialize state with referrer header and redirect with return location
  
  it('should initialize state with return to query parameter and redirect with return location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login',
        returnTo: 'https://www.example.com/app'
      });
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com'
        }
        req.connection = { encrypted: true };
        req.query = { return_to: 'https://www.example.com/app' };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?return_to=https%3A%2F%2Fwww.example.com%2Fapp');
        done();
      })
      .listen();
  }); // should initialize state with return to query parameter and redirect with return location
  
  it('should initialize state with state query parameter and redirect with resume state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login',
        resumeState: '00000000'
      });
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login?state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.query = { state: '00000000' };
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
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state with state query parameter and redirect with resume state
  
  // TODO: review this test
  it('should initialize state with state query parameter and redirect with current state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login?state=11111111';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.query = { state: '11111111' };
        req.session = {};
        req.session.state = {};
        req.session.state['11111111'] = {
          location: 'https://server.example.com/login',
          messages: [ 'Invalid username or password.' ]
        };
      })
      .finish(function() {
        expect(store.load).to.have.callCount(1);
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/login',
          messages: [ 'Invalid username or password.' ]
        });
        // FIXME: This should update the location to /login/password
        expect(this.req.session).to.deep.equal({
          state: {
            '11111111': {
              location: 'https://server.example.com/login',
              messages: [ 'Invalid username or password.' ]
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?state=11111111');
        done();
      })
      .listen();
  }); // should initialize state with state query parameter and redirect with current state
  
});
