var expect = require('chai').expect;
var chai = require('chai');
var sinon = require('sinon');
var clean = require('../../lib/middleware/clean');
var SessionStore = require('../../lib/store/session');


describe('middleware/clean', function() {
  
  var clock;
  
  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });
  
  afterEach(function() {
    clock.restore();
  });
  
  it('should not clean when session is not available', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    chai.express.use(clean({ store: store }))
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(req.session).to.be.undefined;
        done();
      })
      .listen();
  }); // should not clean when session is not available
  
  it('should not clean empty session', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    chai.express.use(clean({ store: store }))
      .request(function(req, res) {
        req.session = {};
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should not clean empty session
  
  it('should destroy expired state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    clock.tick(1095292800000);
    
    chai.express.use(clean({ store: store }))
      .request(function(req, res) {
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz',
          expires: new Date(Date.now() - 3600000).toJSON()
        };
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        expect(req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should destroy expired state
  
  it('should destroy exactly expired state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');
    
    clock.tick(1095292800000);
    
    chai.express.use(clean({ store: store }))
      .request(function(req, res) {
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz',
          //expires: '2021-11-11T20:01:40.513Z'
          //expires: '2020-11-11T20:01:40.513Z'
          //expires: '2022-11-11T20:01:40.513Z'
          expires: new Date().toJSON()
        };
      })
      .next(function(err, req, res) {
        if (err) { return done(err); }
        
        expect(store.get).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        expect(req.session).to.deep.equal({});
        done();
      })
      .listen();
  }); // should destroy exactly expired state
  
});
