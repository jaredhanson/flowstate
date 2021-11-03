var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/stores/session');


describe('[OAuth 2.0] GET /authorize', function() {
  
  it('redirecting for login after modifying state', function(done) {
    var store = new SessionStore({ genh: function() { return '00000000' } });
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      req.state.clientID = req.query.client_id;
      req.state.redirectURI = req.query.redirect_uri;
      req.state.state = req.query.state;
      res.redirect('/login');
    }
  
    chai.express.use([ state({ external: true, continue: '/authorize/continue', store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.headers = {
          'host': 'server.example.com'
        }
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
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
    
      chai.express.use([ state({ store: store }), handler ])
        .request(function(req, res) {
          response = res;
          
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
        .finish(function() {
          done();
        })
        .listen();
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
