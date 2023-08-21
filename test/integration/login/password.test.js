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
  
describe('POST /login/password', function() {
  
  // TODO: Put a render test in like this one below
  
  // TODO: review this test
  // NOTE: seems fixed now
  it('should initialize state by ignoring invalid state body parameter and not resume state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password'
      });
      res.resumeState(next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
    
    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        }
        req.connection = { encrypted: true };
        req.body = { username: 'Aladdin', password: 'open sesame', state: '00000000' };
        req.session = {};
        req.session.state = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        // FIXME: should be 1, if no yields
        //expect(store.get).to.have.callCount(2);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {}
        });
        
        expect(this.statusCode).to.equal(302);
        // FIXME: this shouldn't have state parameter???
        expect(this.getHeader('Location')).to.equal('/home');
        done();
      })
      .listen();
  }); // should initialize state by ignoring invalid state body parameter and not resume state
  
}); // POST /login/password
