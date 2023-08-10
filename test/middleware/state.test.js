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
  
  it('should initialize state with return URL from referrer header', function(done) {
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
  }); // should initialize state with return URL from referrer header
  
  it('should initialize state with return URL from query parameter', function(done) {
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
  }); // should initialize state with return URL from query parameter
  
  it('should initialize state with return URL from body parameter', function(done) {
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
  }); // should initialize state with return URL from body parameter
  
  it('should initialize external state', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?client_id=s6BhdRkqt3';
        req.headers = {
          'host': 'server.example.com'
        };
        req.query = { client_id: 's6BhdRkqt3' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://server.example.com/authorize',
          returnTo: 'https://server.example.com/authorize?client_id=s6BhdRkqt3'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize external state
  
  it('should initialize external state with URL containing state parameter', function(done) {
    var store = new SessionStore();
  
    chai.express.use([ state({ external: true, store: store }) ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/authorize?client_id=s6BhdRkqt3&state=xyz';
        req.headers = {
          'host': 'server.example.com'
        };
        req.query = { client_id: 's6BhdRkqt3', state: 'xyz' };
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://server.example.com/authorize',
          returnTo: 'https://server.example.com/authorize?client_id=s6BhdRkqt3&state=xyz'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize external state with URL containing state parameter
  
});