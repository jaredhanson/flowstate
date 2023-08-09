var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , SessionStore = require('../../lib/store/session');


describe('SessionStore', function() {
  
  describe('#get', function() {
    var store = new SessionStore();
    
    it('should do something', function(done) {
      var req = new Object();
      req.session = {};
      req.session.state = {};
      req.session.state['xyz'] = {
        cow: 'moo'
      };
  
      store.get(req, 'xyz', function(err, state) {
        expect(err).to.be.null;
        expect(state).to.deep.equal({
          cow: 'moo'
        });
        expect(state).to.not.equal(req.session.state['xyz']);
        done();
      });
    }); // should resolve A record of node
    
  }); // #get
  
});
