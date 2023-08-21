var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#resumeState', function() {
  
  it('should proceed to next middleware without state', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com'
        };
        req.body = {};
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('/home');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should proceed to next middleware without state
  
  it('should redirect to body parameter as redirect URL', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com'
        };
        req.body = { return_to: 'https://www.example.com/bienvenido' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://www.example.com/bienvenido');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/bienvenido'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should redirect to body parameter as redirect URL
  
  it('should redirect to body parameters as redirect URL with state', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://www.example.com/authorize/continue?state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should redirect to body parameters as redirect URL with state
  
  it('should redirect with redirect URL after completing current state when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
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
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://client.example.com/');
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL after completing current state when processing a non-mutating request
  
  it('should redirect with redirect URL and state after completing current state when processing a non-mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
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
          returnTo: 'https://client.example.com/authorize/continue',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://client.example.com/authorize/continue?state=xyz');
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/authorize/continue',
          state: 'xyz'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL and state after completing current state when processing a non-mutating request
  
  it('should redirect with redirect URL after completing current state when processing a mutating request', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
  
    function handler(req, res, next) {
      res.resumeState(next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
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
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://client.example.com/');
        expect(this.req.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(store.get).to.have.callCount(1);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        done();
      })
      .listen();
  }); // should redirect with redirect URL after completing current state when processing a mutating request
  
  it('should yield arguments by encoding them as query parameters to redirect URL', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.resumeState({ authuser: '1' }, next);
    }
  
    function home(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, home ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/session/select';
        req.headers = {
          'host': 'www.example.com'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://www.example.com/authorize/continue?authuser=1&state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/session/select',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); // should yield arguments by encoding them as query parameters to redirect URL
  
});
