var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#redirect', function() {
  
  it('should redirect without state', function(done) {
    var store = new SessionStore();
    
    function handler(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/home');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should redirect without state
  
});
