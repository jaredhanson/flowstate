var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow', function() {
  
  
  
  
  /***/
  
  // TODO: continuing from a new state without parent state (loading finish handlers from registered state)
  
  // TODO: Modify new and current states and rerender.  Test for persisting state.
  // TODO: Prompt from new and current states
  
  
  
  /***/
  
  describe('resuming with error synthesized state which continues with error', function() {
    var hc = 1;
    var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
      , request, response, error;
    
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
    
    before(function(done) {
      dispatcher.use('login', null, [
        function(req, res, next) {
          res.__track += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          next();
        },
        function(err, req, res, next) {
          res.__track += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          next(err);
        }
      ], [
        function(req, res, next) {
          res.__track += '[F]';
          res.redirect('/from/' + req.state.name);
        },
        function(err, req, res, next) {
          res.__track += '[E]';
          next(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__track = req.state.name;
        next(new Error('something went wrong'));
      }
      
      function errorHandler(err, req, res, next) {
        res.__track += '/E';
        next(err);
      }
      
      
      chai.express.handler([dispatcher.flow('authenticate', handler, { through: 'login' }), errorHandler])
        .req(function(req) {
          request = req;
          request.body = {};
          request.session = {};
        })
        .res(function(res) {
          response = res;
        })
        .next(function(err) {
          error = err;
          done();
        })
        .dispatch();
    });
    
    after(function() {
      dispatcher._store.destroy.restore();
      dispatcher._store.update.restore();
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
    });
    
    
    it('should track correctly', function() {
      expect(response.__track).to.equal('authenticate E:login(authenticate)[E]/E');
    });
    
    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.be.undefined;
      expect(request.state).to.deep.equal({
        name: 'login'
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.be.undefined;
      expect(request.yieldState).to.deep.equal({
        name: 'authenticate'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });
    
    it('should continue with error', function() {
      expect(error.message).to.equal('something went wrong');
    });
  }); // resuming with error synthesized state which continues with error
  
});
