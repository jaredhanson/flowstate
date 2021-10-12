var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/stores/session');


describe('GET /oauth2/authorize', function() {
  
  describe('redirecting for login', function() {
    var store = new SessionStore({ genh: function() { return 'XXXXXXXX' } })
      , request, response, err;
  
    before(function() {
      sinon.spy(store, 'load');
      sinon.spy(store, 'save');
      sinon.spy(store, 'update');
      sinon.spy(store, 'destroy');
    });
  
    before(function(done) {
      function handler(req, res, next) {
        res.redirect('/login');
      }
    
      chai.express.handler([state({ external: true, continue: '/continue', store: store }), handler])
        .req(function(req) {
          request = req;
          request.connection = { encrypted: true };
          request.method = 'POST';
          request.headers = {
            'host': 'server.example.com'
          }
          request.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
          request.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://client.example.com/cb' };
          request.session = {};
        })
        .res(function(res) {
          response = res;
        })
        .end(function(res) {
          done();
        })
        .dispatch();
    });


    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(0);
      expect(store.save).to.have.callCount(1);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });
    
    it('should persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'XXXXXXXX': {
            location: 'https://server.example.com/continue'
          }
        }
      });
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login?state=XXXXXXXX');
    });
  }); // redirecting for login
  
});
