var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('middleware/state', function() {
  
  it('should initialize state', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state
  
  it('should initialize state that will eventually redirect to referrer', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually redirect to referrer
  
  it('should initialize state that will eventually redirect to URL specified by query parameter', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/welcome'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually redirect to URL specified by query parameter
  
  it('should initialize state that will eventually redirect to URL specified by body parameter', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/bienvenido'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually redirect to URL specified by body parameter
  
  it('should initialize state that will eventually redirect to URL with state specified by query parameter', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
          location: 'https://wwww.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/dashboard/cb',
          state: 'xyz'
        };
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually redirect to URL with state specified by query parameter
  
  it('should initialize state that will eventually redirect to URL with state specified by body parameter', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually redirect to URL with state by body parameter
  
  it('should initialize state that will eventually redirect to URL with state when that state is not found in state store', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
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
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          returnTo: 'https://www.example.com/authorize/continue',
          state: 'xxx'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually redirect to URL with state when that state is not found in state store
  
  it('should load state specified by query parameter when it is intended for endpoint', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?state=456';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.query = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.false;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          messages: [ 'Invalid username or password.' ],
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should load state specified by query parameter when it is intended for endpoint
  
  it('should load state specified by body parameter when it is intended for endpoint', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'POST';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/login'
        };
        req.body = { state: '456' };
        req.session = {};
        req.session.state = {};
        req.session.state['456'] = {
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        };
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.false;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login',
          failureCount: 1,
          returnTo: 'https://www.example.com/authorize/continue',
          state: '123'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should load state specified by body parameter when it is intended for endpoint
  
  it('should initialize external state to eventually redirect to the request URL', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?client_id=s6BhdRkqt3';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = { client_id: 's6BhdRkqt3' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/authorize',
          returnTo: 'https://www.example.com/authorize?client_id=s6BhdRkqt3'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize external state to eventually redirect to the request URL
  
  it('should initialize external state to eventually redirect to the request URL with state parameter preserved', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?client_id=s6BhdRkqt3&state=xyz';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = { client_id: 's6BhdRkqt3', state: 'xyz' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/authorize',
          returnTo: 'https://www.example.com/authorize?client_id=s6BhdRkqt3&state=xyz'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize external state to eventually redirect to the request URL with state parameter preserved
  
});