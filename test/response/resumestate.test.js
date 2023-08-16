var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#resumeState', function() {
  
  it('should not resume without state', function(done) {
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
  }); // should not resume without state
  
  it('should resume state by redirecting to redirect URL', function(done) {
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
  }); //should resume state by redirecting to redirect URL
  
  it('should resume state by redirecting to redirect URL with state', function(done) {
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
        req.body = { return_to: 'https://www.example.com/bienvenido', state: 'xxx' };
        req.session = {};
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://www.example.com/bienvenido?state=xxx');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/bienvenido',
          state: 'xxx'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); //should resume state by redirecting to redirect URL with state
  
  it('should yield', function(done) {
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
        req.url = '/account/select';
        req.headers = {
          'host': 'www.example.com'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/dashboard/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(this.statusCode).to.equal(302);
        // FIXME: this shouldn't have return_to in it
        expect(this.getHeader('Location')).to.equal('https://www.example.com/authorize/continue?authuser=1&return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123');
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/account/select',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '123': {
              location: 'https://www.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://www.example.com/dashboard/cb',
              state: 'xyz'
            }
          }
        });
        done();
      })
      .listen();
  }); //should yield
  
  it('should redirect to URL to return to', function(done) {
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
        done();
      })
      .listen();
  }); // should redirect to URL to return to
  
});
