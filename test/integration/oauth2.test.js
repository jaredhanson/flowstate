var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/stores/session');


describe('GET /oauth2/authorize', function() {
  
  // TODO: Consider making this touch the state in order to save it.
  describe('redirecting for login', function() {
    var store = new SessionStore({ genh: function() { return '00000000' } })
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
    
      chai.express.handler([ state({ external: true, continue: '/authorize/continue', store: store }), handler ])
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
          '00000000': {
            location: 'https://server.example.com/authorize/continue'
          }
        }
      });
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login?state=00000000');
    });
  }); // redirecting for login
  
}); // GET /oauth2/authorize

describe('GET /oauth2/authorize/continue', function() {
  
  describe('redirecting for consent after selecting account', function() {
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
        req.state.accountSelector = '1';
        res.redirect('/consent');
      }
    
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.headers = {
            'host': 'server.example.com'
          }
          request.url = '/oauth2/authorize/continue?state=00000000';
          request.query = { state: '00000000' };
          request.session = {};
          request.session.state = {};
          request.session.state['00000000'] = {
            location: 'https://server.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          };
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
      expect(store.load).to.have.callCount(1);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(1);
      expect(store.destroy).to.have.callCount(0);
    });
    
    it('should persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          '00000000': {
            location: 'https://server.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz',
            accountSelector: '1'
          }
        }
      });
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/consent?state=00000000');
    });
  }); // redirecting for consent after selecting account
  
});
