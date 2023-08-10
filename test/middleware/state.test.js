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
          'host': 'server.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(req.state.isNew()).to.be.true;
        expect(req.state).to.deep.equal({
          location: 'https://server.example.com/'
        });
        expect(req.stateStore).to.equal(store);
        done();
      })
      .listen();
  }); // should initialize state
  
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
  
  it('should initialize external state with return to URL containing state parameter', function(done) {
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
  }); // sshould initialize external state with return to URL containing state parameter
  
});