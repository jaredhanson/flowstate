var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#pushState', function() {
  
  it('should redirect to pushed state', function(done) {
    var store = new SessionStore();
    
    function handler(req, res, next) {
      req.pushState({
        provider: 'https://server.example.com'
      }, 'https://client.example.com/cb');
      res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
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
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login/federated'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            'xyz': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com'
            }
          }
        });
        done();
      })
      .listen();
  }); // should redirect to pushed state
  
});
