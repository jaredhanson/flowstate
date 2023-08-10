var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , SessionStore = require('../../lib/store/session')
  , State = require('../../lib/state');


describe('SessionStore', function() {
  
  describe('defaults', function() {
  
    describe('#get', function() {
    
      it('should get state', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
        req.session.state['xyz'] = {
          cow: 'moo'
        };
  
        var store = new SessionStore();
        store.get(req, 'xyz', function(err, state) {
          expect(err).to.be.null;
          expect(state).to.deep.equal({
            cow: 'moo'
          });
          expect(state).to.not.equal(req.session.state['xyz']);
          done();
        });
      }); // should get session
    
      it('should not get state if state does not exist', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
  
        var store = new SessionStore();
        store.get(req, 'xyz', function(err, state) {
          expect(err).to.be.undefined;
          expect(state).to.be.undefined;
          done();
        });
      }); // should not get state if state does not exist
    
      it('should not get state if no session state exists', function(done) {
        var req = new Object();
        req.session = {};
  
        var store = new SessionStore();
        store.get(req, 'xyz', function(err, state) {
          expect(err).to.be.undefined;
          expect(state).to.be.undefined;
          done();
        });
      }); // should not get state if no session state exists
    
      it('should error if no session exists', function(done) {
        var req = new Object();
  
        var store = new SessionStore();
        store.get(req, 'xyz', function(err, state) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('State requires session support. Did you forget to use `express-session` middleware?');
          expect(state).to.be.undefined;
          done();
        });
      }); // should error if no session exists
    
    }); // #get
    
    describe('#set', function() {
      
      it('should set state', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
        
        var state = new State(req, { cow: 'moo' });
        var store = new SessionStore();
        store.set(req, 'xyz', state, function(err) {
          expect(err).to.be.null;
          expect(req.session.state['xyz']).to.deep.equal({
            cow: 'moo'
          });
          expect(req.session.state['xyz']).to.not.be.an.instanceOf(State);
          done();
        });
      }); // should set state
      
      it('should set state if session state does not exist', function(done) {
        var req = new Object();
        req.session = {};
        
        var state = new State(req, { cow: 'moo' });
        var store = new SessionStore();
        store.set(req, 'xyz', state, function(err) {
          expect(err).to.be.null;
          expect(req.session.state['xyz']).to.deep.equal({
            cow: 'moo'
          });
          expect(req.session.state['xyz']).to.not.be.an.instanceOf(State);
          done();
        });
      }); // should set state if session state does not exist
      
      it('should error if no session exists', function(done) {
        var req = new Object();
        
        var state = new State(req, { cow: 'moo' });
        var store = new SessionStore();
        store.set(req, 'xyz', state, function(err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('State requires session support. Did you forget to use `express-session` middleware?');
          done();
        });
      }); // should error if no session exists
      
    }); // #set
    
  }); // defaults
  
});
