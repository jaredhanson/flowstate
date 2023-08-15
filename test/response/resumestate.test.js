var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#resumeState', function() {
  
  it('should redirect to URL to return to', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
        req.headers = {
          'host': 'client.example.com'
        };
        req.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
        req.session = {};
        req.session.state = {};
        req.session.state['af0ifjsldkj'] = {
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://client.example.com/');
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should redirect to URL to return to
  
});
