var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#complete', function() {
  
  describe('resuming parent state from loaded, unnamed state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [function(req, res, next) {
        res.end('foo.');
      }]);
      
      
      chai.connect.use(dispatcher.complete())
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'bar', y: 2, prev: '12345678' };
          request.session = { state: {} };
          request.session.state['12345678'] = { name: 'foo', x: 1 };
          request.session.state['22345678'] = { name: 'bar', y: 2, prev: '12345678' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        handle: '12345678',
        name: 'foo',
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        handle: '22345678',
        name: 'bar',
        y: 2,
        prev: '12345678'
      });
    });
    
    it('should remove state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          '12345678': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('foo.');
    });
  }); // resuming parent state from loaded, unnamed state
  
});
