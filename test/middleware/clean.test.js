var expect = require('chai').expect;
var chai = require('chai');
var sinon = require('sinon');
var clean = require('../../lib/middleware/clean');
var SessionStore = require('../../lib/store/session');


describe('middleware/clean', function() {
  
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
  
});
