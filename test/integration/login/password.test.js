var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('GET /login/password', function() {
    
  it('should initialize state without properties and render without state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
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
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({});
        done();
      })
      .listen();
  }); // should initialize state without properties and render without state parameter
  
  it('should initialize state with referrer header and render with state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login'
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
          returnTo: 'https://server.example.com/login'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://server.example.com/login' });
        done();
      })
      .listen();
  }); // should initialize state with referrer header and render with state
  
  it('should initialize state with return to query parameter and render with state', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com'
        }
        req.connection = { encrypted: true };
        req.query = { return_to: 'https://client.example.com/' };
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
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://client.example.com/' });
        done();
      })
      .listen();
  }); // should initialize state with return to query parameter and render with state
  
  it('should initialize state with return to query parameter in preference to referrer header and render with state', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login'
        }
        req.connection = { encrypted: true };
        req.query = { return_to: 'https://client.example.com/' };
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
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://client.example.com/' });
        done();
      })
      .listen();
  }); // should initialize state with return to query parameter in preference to referrer header and render with state
  
  it('should initialize state with state query parameter and render with state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password?state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login'
        }
        req.connection = { encrypted: true };
        req.query = { state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
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
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            }
          }
        });
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ state: '00000000' });
        done();
      })
      .listen();
  }); // should initialize state with state query parameter and render with state
  
}); // GET /login/password
  
describe('POST /login/password', function() {
  
  it('from same resource as referring page', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.resumeState(next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }

    // TODO: Consider initializing state middleware with a default return to URL
    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password'
        }
        req.connection = { encrypted: true };
        req.body = { username: 'Aladdin', password: 'open sesame' };
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
        // TODO: Should this return to referrer?
        expect(this.getHeader('Location')).to.equal('/home');
        done();
      })
      .listen();
  }); // from same resource as referring page
  
  it('should initialize state with return to body parameter and redirect to location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
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
          'referer': 'https://server.example.com/login/password'
        }
        req.connection = { encrypted: true };
        req.body = { username: 'Aladdin', password: 'open sesame', return_to: 'https://client.example.com/' };
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
        expect(this.getHeader('Location')).to.equal('https://client.example.com/');
        done();
      })
      .listen();
  }); // should initialize state with return to body parameter and redirect to location
  
  it('should initialize state with state body parameter and resume state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
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
          'referer': 'https://server.example.com/login/password'
        }
        req.connection = { encrypted: true };
        req.body = { username: 'Aladdin', password: 'open sesame', state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.load).to.have.callCount(2); // FIXME: should onl be called once
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          state: '00000000'
        });
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
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize/continue?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state with state body parameter and resume state
  
}); // POST /login/password
