var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('GET /oauth2/authorize', function() {
  
  // TODO: Test cases for account select yeilding back with query param and then setting it in state
  
  it('should initialize state by ignoring external state and redirect with return location', function(done) {
    var store = new SessionStore({ genh: function() { return '00000000' } });
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/authorize',
        returnTo: 'https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb'
      });
      
      res.redirect('/login');
    }
  
    chai.express.use([ state({ external: true, store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://client.example.com/cb' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login?return_to=https%3A%2F%2Fserver.example.com%2Fauthorize%3Fresponse_type%3Dcode%26client_id%3Ds6BhdRkqt3%26state%3Dxyz%26redirect_uri%3Dhttps%253A%252F%252Fclient%252Eexample%252Ecom%252Fcb');
        done();
      })
      .listen();
  }); // should initialize state by ignoring external state and redirect with return location
  
  it('should initialize state by ignoring external state and redirect with pushed state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/authorize',
        returnTo: 'https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb'
      });
      
      req.pushState({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        state: req.query.state
      }, '/authorize/continue');
      
      
      // TODO: Assert that the state hasn't changed after pushing
      
      res.redirect('/login');
    }
  
    chai.express.use([ state({ external: true, store: store, genh: function() { return '00000000' } }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://client.example.com/cb' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
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
        expect(this.getHeader('Location')).to.equal('/login?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state by ignoring external state and redirect with pushed state
  
}); // GET /oauth2/authorize
