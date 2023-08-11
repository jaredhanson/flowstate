var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#render', function() {
  
  it('should render', function(done) {
    var store = new SessionStore();
    
    function handler(req, res, next) {
      res.render('home')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('home')
                    .with.deep.locals({});
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render
  
  it('should render with returnTo set to referrer', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with returnTo set to referrer
  
  it('should render with returnTo set to URL specified by query parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fwelcome';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: 'https://www.example.com/welcome' };
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/welcome' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/welcome'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with returnTo set to URL specified by query parameter
  
  it('should render with returnTo set to URL specified by body parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.body = { return_to: 'https://www.example.com/bienvenido' };
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/bienvenido' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/bienvenido'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with returnTo set to URL specified by query parameter
  
  it('should render with returnTo URL and state as specified by query parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=00000000';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/dashboard'
        };
        req.query = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
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
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: '123' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
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
  }); // should render with returnTo URL and state as specified by query parameter
  
  it('should render with returnTo URL and state as specified by body parameter', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
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
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: '123' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
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
  }); // should render with returnTo URL and state as specified by body parameter
  
  it('should render with returnTo URL and state when that state is not found in state store', function(done) {
    var store = new SessionStore();
  
    function handler(req, res, next) {
      res.render('login')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { return_to: 'https://www.example.com/authorize/continue', state: 'xxx' };
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('login')
                    .with.deep.locals({ returnTo: 'https://www.example.com/authorize/continue', state: 'xxx' });
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: 'xxx'
        });
        expect(this.req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should render with returnTo URL and state when that state is not found in state store
  
});
