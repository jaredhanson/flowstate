var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , SessionStore = require('../../lib/store/session')
  , State = require('../../lib/state');


describe('SessionStore', function() {
  
  describe('defaults', function() {
    
    describe('#all', function() {
      
      it('should get all states', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
        req.session.state['xyz'] = {
          cow: 'moo'
        };
        req.session.state['123'] = {
          pig: 'oink'
        };
  
        var store = new SessionStore();
        store.all(req, function(err, states) {
          expect(err).to.be.null;
          expect(states).to.deep.equal([ {
            handle: '123',
            pig: 'oink'
          }, {
            handle: 'xyz',
            cow: 'moo'
          } ]);
          expect(states[0]).to.not.equal(req.session.state['123']);
          expect(states[1]).to.not.equal(req.session.state['xyz']);
          done();
        });
      }); // should get all states
      
      it('should error if no session exists', function(done) {
        var req = new Object();
  
        var store = new SessionStore();
        store.all(req, function(err, states) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('State requires session support. Did you forget to use `express-session` middleware?');
          expect(states).to.be.undefined;
          done();
        });
      }); // should error if no session exists
      
    }); // #all
  
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
      }); // should get state
    
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
    
    describe('#destroy', function() {
      
      it('should destroy state', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
        req.session.state['xyz'] = {
          cow: 'moo'
        };
  
        var store = new SessionStore();
        store.destroy(req, 'xyz', function(err) {
          expect(err).to.be.undefined;
          expect(req.session).to.deep.equal({});
          done();
        });
      }); // should destroy state
      
      it('should destroy state and preserve other state', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
        req.session.state['xyz'] = {
          cow: 'moo'
        };
        req.session.state['123'] = {
          pig: 'oink'
        };
  
        var store = new SessionStore();
        store.destroy(req, 'xyz', function(err) {
          expect(err).to.be.undefined;
          expect(req.session.state).to.deep.equal({
            '123': {
              pig: 'oink'
            }
          });
          done();
        });
      }); // should destroy state and preserve other state
      
      it('should destroy state if state does not exist', function(done) {
        var req = new Object();
        req.session = {};
        req.session.state = {};
  
        var store = new SessionStore();
        store.destroy(req, 'xyz', function(err) {
          expect(err).to.be.undefined;
          expect(req.session).to.deep.equal({
            state: {}
          });
          done();
        });
      }); // should destroy state if state does not exist
      
      it('should destroy state if no session state exists', function(done) {
        var req = new Object();
        req.session = {};
  
        var store = new SessionStore();
        store.destroy(req, 'xyz', function(err) {
          expect(err).to.be.undefined;
          expect(req.session).to.deep.equal({});
          done();
        });
      }); // should destroy state if no session state exists
      
      it('should error if no session exists', function(done) {
        var req = new Object();
  
        var store = new SessionStore();
        store.destroy(req, 'xyz', function(err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('State requires session support. Did you forget to use `express-session` middleware?');
          done();
        });
      }); // should error if no session exists
      
    }); // #destroy
    
  }); // defaults
  
});
