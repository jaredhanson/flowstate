var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('IncomingMessage#popState', function() {
  
  // TODO: review this
  it('should push and pop state linked to external location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    function handler(req, res, next) {
      req.pushState({
        clientID: req.query.client_id,
        redirectURI: req.query.redirect_uri,
        externalState: req.query.state
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
