var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('POST /token', function() {
  
  // TODO: Clean this up and make a "BodyStateStore" to be more illustrative
  
  it('should load state with state query parameter and render with current state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/token',
        beep: 'boop'
      });
      res.render('response/token.xml');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'POST';
        req.url = '/token';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/token'
        }
        req.connection = { encrypted: true };
        req.body = { state: '11111111' };
        req.session = {};
        req.session.state = {};
        req.session.state['11111111'] = {
          location: 'https://server.example.com/token',
          beep: 'boop'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/token',
          beep: 'boop'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('response/token.xml')
                    .with.deep.locals({});
        done();
      })
      .listen();
  }); // should load state with state query parameter and render with state
  
  it('should load state with state query parameter and render with current state after modifying', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/token',
        beep: 'boop'
      });
      req.state.foo = 'bar';
      res.status(400).render('response/token.xml');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'POST';
        req.url = '/token';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/token'
        }
        req.connection = { encrypted: true };
        req.body = { state: '11111111' };
        req.session = {};
        req.session.state = {};
        req.session.state['11111111'] = {
          location: 'https://server.example.com/token',
          beep: 'boop'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(1);
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          location: 'https://server.example.com/token',
          beep: 'boop',
          foo: 'bar'
        });
        expect(this.req.session).to.deep.equal({
          state: {
            '11111111': {
              location: 'https://server.example.com/token',
              beep: 'boop',
              foo: 'bar'
            }
          }
        });
        
        expect(this.statusCode).to.equal(400);
        expect(this).to.render('response/token.xml')
                    .with.deep.locals({ state: '11111111' });
        done();
      })
      .listen();
  }); // should load state with state query parameter and render with state after modifiying
  
});
