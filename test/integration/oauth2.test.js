var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/stores/session');


describe('GET /oauth2/authorize', function() {
  
  // TODO: Test case for something like this, but without `state` saved in session (ie SAML)
  
  it('should save state for continue endpoint and redirect with state', function(done) {
    var store = new SessionStore({ genh: function() { return '00000000' } });
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      req.pushState({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        state: req.query.state
      }, '/authorize/continue');
      
      res.redirect('/login');
    }
  
    chai.express.use([ state({ external: true, store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'server.example.com'
        }
        req.connection = { encrypted: true };
        req.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://client.example.com/cb' };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
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
  }); // should save state for continue endpoint and redirect with state
  
}); // GET /oauth2/authorize
