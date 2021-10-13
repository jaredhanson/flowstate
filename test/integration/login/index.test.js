var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('GET /login', function() {
    
  describe('without parameters', function() {
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
        res.redirect('/login/password');
      }
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login';
          request.headers = {
            'host': 'server.example.com'
          }
          request.session = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(0);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({});
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login/password');
    });
  }); // without parameters
  
  describe('with referrer', function() {
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
        res.redirect('/login/password');
      }
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login';
          request.headers = {
            'host': 'server.example.com',
            'referer': 'https://client.example.com/'
          }
          request.session = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(0);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        returnTo: 'https://client.example.com/'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login/password');
    });
  }); // with referrer
  
  describe('with state parameter', function() {
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
        res.redirect('/login/password');
      }
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login?state=00000000';
          request.headers = {
            'host': 'server.example.com',
            'referer': 'https://client.example.com/'
          }
          request.query = { state: '00000000' };
          request.session = {};
          request.session.state = {};
          request.session.state['00000000'] = {
            location: 'https://www.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(1);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });
  
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        state: '00000000'
      });
    });
    
    it('should preserve state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          '00000000': {
            location: 'https://www.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          }
        }
      });
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login/password?state=00000000');
    });
  }); // with state parameter
  
});
