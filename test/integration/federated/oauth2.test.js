var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/store/session')

  // TODO: Move this to login/federated
describe('integration: sso/oauth2', function() {
  
  describe('GET /login/federated', function() {
    
    // TODO: This test needs reviewing
    describe('with state intended for this resource', function() {
      var store = new SessionStore()
        , request, response, err;
  
      before(function() {
        sinon.spy(store, 'get');
        sinon.spy(store, 'set');
        sinon.spy(store, 'destroy');
      });
  
      before(function(done) {
        function handler(req, res, next) {
          req.pushState({
            provider: 'https://server.example.net'
          }, 'https://server.example.com/cb');
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
        }
    
        chai.express.use([state({ store: store, mutationMethods: [ 'GET', 'POST' ], genh: function() { return 'XXXXXXXX' } }), handler])
          .request(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            // TODO: this shouldn't load the state, since it is not intended for the
            //        /login/federated resource, but rather /continue.   Need to handle
            //       this on push state, to set the resume state to the parent state.
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
            request.headers = {
              'host': 'server.example.com',
              'referer': 'https://server.example.com/login?state=00000000'
            }
            request.query = { provider: 'https://server.example.net', state: '00000000' };
            request.session = {};
            request.session.state = {};
            request.session.state['00000000'] = {
              location: 'https://server.example.com/login/federated',
              provider: 'https://myshopify.com',
              shop: 'example.myshopify.com',
              returnTo: '/'
            };
          })
          .finish(function() {
            response = this;
            done();
          })
          .listen();
      });


      it('should correctly invoke state store', function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(1);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/login/federated',
          provider: 'https://myshopify.com',
          shop: 'example.myshopify.com',
          returnTo: '/'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'XXXXXXXX': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              returnTo: '/'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=XXXXXXXX');
      });
    }); // with state intended for this resource
    
  });
  
});


describe('GET /oauth2/redirect', function() {

  it('should complete state and then return to location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://client.example.com/cb',
        provider: 'http://server.example.com',
        returnTo: 'https://client.example.com/'
      });
      
      res.resumeState(next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, redirect ])
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
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://client.example.com/');
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should complete state and then return to location
  
  // TODO: Test case without returnTo
  
  // TODO: Test case for popping return data into state and/or query params
  //       (for example, when a session is not established, but the return to page needs info)

}); // redirect back from OAuth 2.0 authorization server
