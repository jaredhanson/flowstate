var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('GET /oauth2/authorize', function() {
  
  // TODO: Test cases for account select yeilding back with query param and then setting it in state
  
  // TODO: review this
  it('should initialize state by ignoring external state and respond after popping and completing state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/authorize',
        returnTo: 'https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb'
      });
      
      req.popState();
      req.state.complete();
      res.redirect('https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz');
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
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({});
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/authorize',
          //returnTo: 'https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb'
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://client.example.com/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz');
        done();
      })
      .listen();
  }); // should initialize state by ignoring external state and respond after popping and completing state
  
}); // GET /oauth2/authorize


describe('GET /oauth2/authorize/continue', function() {
  
});


