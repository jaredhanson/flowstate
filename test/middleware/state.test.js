var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('middleware/state', function() {
  
  it('should redirect with return location', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/';
        req.headers = {
          'host': 'server.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        // TODO: remove returnTo here?
        expect(req.state).to.deep.equal({
          location: 'https://server.example.com/',
          returnTo: 'https://server.example.com/'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should redirect with return location
  
});