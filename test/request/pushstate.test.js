var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('IncomingMessage#pushState', function() {
  
  it('should redirect after saving pushed state without state', function(done) {
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
  }); // should redirect after saving pushed state without state
  
  it('should redirect after saving pushed state that redirects to URL specified as referrer header', function(done) {
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
  }); // should redirect after saving pushed state that redirects to URL specified as referrer header
  
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
  
});
