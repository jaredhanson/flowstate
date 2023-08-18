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
  
  it('should not resume without state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login/password'
      });
      
      res.resumeState(next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }

    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'www.example.com'
        };
        req.body = { username: 'Aladdin', password: 'open sesame' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/home');
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should not resume without state
  
  it('should resume by returning to location', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login/password',
        returnTo: 'https://www.example.com/app'
      });
      
      res.resumeState(next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }

    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login/password?return_to=https%3A%2F%2Fwww.example.com%2Fapp'
        };
        req.body = { username: 'Aladdin', password: 'open sesame', return_to: 'https://www.example.com/app' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://www.example.com/app');
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should resume by returning to location
  
  it('should resume by returning to location with state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        returnTo: 'https://server.example.com/authorize/continue',
        state: '00000000'
      });
      
      res.resumeState(next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
    
    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password?return_to=https%3A%2F%2Fserver.example.com%2Fauthorize%2Fcontinue&state=00000000'
        };
        req.body = { username: 'Aladdin', password: 'open sesame', return_to: 'https://server.example.com/authorize/continue', state: '00000000' };
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
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize/continue?state=00000000');
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
        done();
      })
      .listen();
  }); // should resume by returning to location with state
  
  it('should redirect with return location and state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        returnTo: 'https://server.example.com/authorize/continue',
        state: '00000000'
      });
      
      res.redirect('/account/change-password');
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
    
    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password?return_to=https%3A%2F%2Fserver.example.com%2Fauthorize%2Fcontinue&state=00000000'
        };
        req.body = { username: 'Aladdin', password: 'open sesame', return_to: 'https://server.example.com/authorize/continue', state: '00000000' };
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
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/account/change-password?return_to=https%3A%2F%2Fserver.example.com%2Fauthorize%2Fcontinue&state=00000000');
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
        done();
      })
      .listen();
  }); // should redirect with return location and state
  
  it('should redirect with return location and state from current state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        messages: [ 'Invalid username or password.' ],
        returnTo: 'https://server.example.com/authorize/continue',
        state: '00000000'
      });
      
      res.redirect('/account/change-password');
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
    
    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password?state=11111111'
        };
        req.body = { username: 'Aladdin', password: 'open sesame', state: '11111111' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
        req.session.state['11111111'] = {
          location: 'https://server.example.com/login/password',
          messages: [ 'Invalid username or password.' ],
          returnTo: 'https://server.example.com/authorize/continue',
          state: '00000000'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/account/change-password?return_to=https%3A%2F%2Fserver.example.com%2Fauthorize%2Fcontinue&state=00000000');
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
        done();
      })
      .listen();
  }); // should redirect with location and state after completing current state
  
  // TODO: Put a render test in like this one below
  
  it('should redirect with state after modifying current state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        returnTo: 'https://server.example.com/authorize/continue',
        state: '00000000'
      });
      // TODO: Should this use pushState?
      // TODO: What if it redirects to `/login?
      req.state.messages = req.session.messages || [];
      req.state.messages.push('Invalid username or password.');
      req.state.complete(false);
      res.redirect('/login/password');
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
    
    chai.express.use([ state({ store: store, genh: function() { return '11111111' } }), handler, redirect ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password?return_to=https%3A%2F%2Fserver.example.com%2Fauthorize%2Fcontinue&state=00000000'
        };
        req.body = { username: 'Aladdin', password: 'open sesame', return_to: 'https://server.example.com/authorize/continue', state: '00000000' };
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
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            '11111111': {
              location: 'https://server.example.com/login/password',
              messages: [ 'Invalid username or password.' ],
              returnTo: 'https://server.example.com/authorize/continue',
              state: '00000000'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?state=11111111');
        done();
      })
      .listen();
  }); // should redirect with state after modifying current state
  
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
