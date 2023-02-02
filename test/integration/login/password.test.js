var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/store/session');


describe('GET /login/password', function() {
    
  it('should render without state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login/password'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'www.example.com'
        };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({});
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render without state
  
  it('should render with return location set to referrer', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login/password',
        returnTo: 'https://www.example.com/'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://www.example.com/' });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with return location set to referrer
  
  it('should render with return location set to query parameter', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login/password',
        returnTo: 'https://www.example.com/app'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = { return_to: 'https://www.example.com/app' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://www.example.com/app' });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with return location set to query parameter
  
  it('should render with return location set to query parameter overriding referrer header', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://www.example.com/login/password',
        returnTo: 'https://www.example.com/app'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: 'https://www.example.com/app' };
        req.session = {};
      })
      .finish(function() {
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://www.example.com/app' });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with return location set to query parameter overriding referrer header
  
  // TODO: Review this
  it('should render with return location and state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        resumeState: '00000000'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password?state=00000000';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://client.example.com/'
        };
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
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ state: '00000000' });
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
  }); // should render with return location and state
  
  it('should render with state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        messages: [ 'Invalid username or password.' ],
        resumeState: '00000000'
      });
      
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login/password?state=11111111';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password?state=00000000'
        };
        req.query = { state: '11111111' };
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
          resumeState: '00000000'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ state: '11111111' });
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
              resumeState: '00000000'
            }
          }
        });
        done();
      })
      .listen();
  }); // should load state from state query parameter and render with that state
  
  it('should ignore invalid referrer', function(done) {
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
  }); // should ignore invalid referrer
  
}); // GET /login/password
  
describe('POST /login/password', function() {
  
  it('should not resume when there is no state', function(done) {
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
  }); // should not resume when there is no state
  
  it('should return to location', function(done) {
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
          'referer': 'https://www.example.com/login/password'
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
  }); // should return to location
  
  it('should initialize state with state body parameter and redirect with resume state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        resumeState: '00000000'
      });
      res.redirect('/account/change-password');
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
          'referer': 'https://server.example.com/login/password?state=00000000'
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
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
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
        expect(this.getHeader('Location')).to.equal('/account/change-password?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state with state body parameter and redirect with resume state
  
  it('should load state from state body parameter and redirect with resume state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        messages: [ 'Invalid username or password.' ],
        resumeState: '00000000'
      });
      res.redirect('/account/change-password');
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
          'referer': 'https://server.example.com/login/password?state=11111111'
        }
        req.connection = { encrypted: true };
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
          resumeState: '00000000'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
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
        expect(this.getHeader('Location')).to.equal('/account/change-password?state=00000000');
        done();
      })
      .listen();
  }); // should load state from state body parameter and redirect with resume state
  
  it('should initialize state with state body parameter and resume state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        resumeState: '00000000'
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
          'referer': 'https://server.example.com/login/password?state=00000000'
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
        expect(store.get).to.have.callCount(2); // FIXME: should onl be called once
        expect(store.set).to.have.callCount(0);
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
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize/continue?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state with state body parameter and resume state
  
  // TODO: Put a render test in like this one below
  
  it('should initialize state with state body parameter and redirect to location after modifying state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/login/password',
        resumeState: '00000000'
      });
      // TODO: Should this use pushState?
      // TODO: What if it redirects to `/login?
      req.state.messages = req.session.messages || [];
      req.state.messages.push('Invalid username or password.');
      res.redirect('/login/password');
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
    
    chai.express.use([ state({ store: store, genh: function() { return '11111111' } }), handler, redirect ])
      .request(function(req, res) {
        req.method = 'POST';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login/password?state=00000000'
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
              resumeState: '00000000'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/login/password?state=11111111');
        done();
      })
      .listen();
  }); // should initialize state with state body parameter and redirect to location after modifying state
  
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
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {}
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/home');
        done();
      })
      .listen();
  }); // should initialize state by ignoring invalid state body parameter and not resume state
  
}); // POST /login/password
