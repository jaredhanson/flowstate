var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('middleware/state', function() {
  
  it('should initialize empty state', function(done) {
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
  }); // should initialize empty state
  
  it('should initialize empty state due to ignoring invalid state', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.net/'
        };
        req.query = { state: 'xxx' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize empty state due to ignoring invalid state
  
  it('should initialize empty state due to ignoring cross-origin referrer', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.net/'
        };
        req.query = {};
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/login'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize empty state due to ignoring cross-origin referrer
  
  it('should initialize state that will eventually return to referrer', function(done) {
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
  }); // should initialize state that will eventually return to referrer
  
  it('should initialize state that will eventually return to URL specified by query parameter', function(done) {
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
  }); // should initialize state that will eventually return to URL specified by query parameter
  
  it('should initialize state that will eventually return to URL specified by body parameter', function(done) {
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
  }); // should initialize state that will eventually return to URL specified by body parameter
  
  it('should initialize state that will eventually return to URL with state specified by query parameter', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/login?return_to=https%3A%2F%2Fwww.example.com%2Fauthorize%2Fcontinue&state=123';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://www.example.com/'
        };
        req.query = { return_to: 'https://www.example.com/authorize/continue', state: '123' };
        req.session = {};
        req.session.state = {};
        req.session.state['123'] = {
          location: 'https://www.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://www.example.com/cb',
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
  }); // should initialize state that will eventually return to URL with state specified by query parameter
  
  it('should initialize state that will eventually return to URL with state specified by body parameter', function(done) {
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
          redirectURI: 'https://www.example.com/cb',
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
  }); // should initialize state that will eventually return to URL with state specified by body parameter
  
  it('should initialize state that will eventually return to URL with state specified by body parameter when that state is not found in state store', function(done) {
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
  }); // should initialize state that will eventually return to URL with state specified by body parameter when that state is not found in state store
  
  it('should load state specified by query parameter when that state is intended for endpoint', function(done) {
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
  }); // should load state specified by query parameter when that state is intended for endpoint
  
  it('should load state specified by body parameter when that state is intended for endpoint', function(done) {
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
  }); // should load state specified by body parameter when that state is intended for endpoint
  
  it('should initialize state that will eventually return to URL of external endpoint', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://client.example.com/'
        };
        req.query = { response_type: 'code', client_id: 's6BhdRkqt3', state: 'xyz', redirect_uri: 'https://client.example.com/cb' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/authorize',
          returnTo: 'https://www.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually return to URL of external endpoint
  
  it('should initialize state that will eventually return to URL of external endpoint with state parameter preserved', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb';
        req.headers = {
          'host': 'www.example.com',
          'referer': 'https://client.example.com/'
        };
        req.query = { client_id: 's6BhdRkqt3', state: 'xyz' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://www.example.com/authorize',
          returnTo: 'https://www.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=xyz&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state that will eventually return to URL of external endpoint with state parameter preserved
  
});