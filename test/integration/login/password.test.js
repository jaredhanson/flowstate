var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/store/session');


describe('GET /login/password', function() {
  
  it('should ignore referrer that is from different subdomain', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({});
        done();
      })
      .listen();
  }); // should ignore referrer that is from different subdomain
  
}); // GET /login/password
