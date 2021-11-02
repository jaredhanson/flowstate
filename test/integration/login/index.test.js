var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('GET /login', function() {
    
  it('should initialize state without properties and redirect without state parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req) {
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'server.example.com'
        }
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({});
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password');
        done();
      })
      .listen();
  }); // should redirect without state parameter
  
  it('should initialize state with referrer header and redirect without state parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req) {
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password');
        done();
      })
      .listen();
  }); // should initialize state with referrer header and redirect without state parameter
  
  it('should initialize state with retury to query parameter and redirect without state parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req) {
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'server.example.com'
        }
        req.query = { return_to: 'https://client.example.com/' };
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password');
        done();
      })
      .listen();
  }); // should initialize state with retury to query parameter and redirect without state parameter
  
  it('should initialize state with state query parameter and redirect with same state parameter', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.redirect('/login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req) {
        req.method = 'GET';
        req.url = '/login?state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.query = { state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://www.example.com/oauth2/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.load).to.have.callCount(1);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          state: '00000000'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://www.example.com/oauth2/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state with state query parameter and redirect with same state parameter
  
});
