var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow', function() {
  
  describe('immediately completing an external state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      function handler(req, res, next) {
        res.redirect('/from/' + req.state.name);
      }
      
      
      chai.express.handler(dispatcher.flow('start', handler, { external: true }))
        .req(function(req) {
          request = req;
          request.query = { state: 'X1' };
          request.session = { state: {} };
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
        name: 'start'
      });
    });
    
    it('should not set yieldState', function() {
      expect(request.yieldState).to.be.undefined;
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({
        state: {}
      });
    });
    
    it('should respond', function() {
      expect(response.getHeader('Location')).to.equal('/from/start');
    });
  }); // resuming parent state from stored child state
  
  describe('resuming parent state from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('bar', handler))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'bar', y: 2, prev: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.equal('H2');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        y: 2,
        prev: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('bar foo(bar)');
    });
  }); // resuming parent state from stored child state
  
  describe('resuming parent state yielding from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          req.state.y = req.yieldState.y;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('bar', handler))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'bar', y: 2, prev: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1,
        y: 2
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState.handle).to.equal('H2');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        y: 2,
        prev: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('bar --bar/foo--> foo(bar)');
    });
  }); // resuming parent state yielding from stored child state
  
  describe('resuming parent state through synthesized state from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      // foo
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      // bar
      dispatcher.use('bar', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt();
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('baz', handler, { through: 'bar' }))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'baz', z: 3, prev: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .next(function(err) {
          console.log(err);
          done(err);
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        prev: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('baz bar(baz) foo(bar)');
    });
  }); // resuming parent state through synthesized state from stored child state
  
  describe('resuming parent state yielding through synthesized state from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      // foo
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          req.state.y = req.yieldState.y;
          req.state.z = req.yieldState.z;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      // bar
      dispatcher.use('bar', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt();
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt(err);
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('baz', handler, { through: 'bar' }))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'baz', z: 3, prev: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .next(function(err) {
          console.log(err);
          done(err);
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1,
        y: undefined,
        z: undefined
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        prev: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('baz bar(baz) --bar/foo--> foo(bar)');
    });
  }); // resuming parent state yielding through synthesized state from stored child state
  
  describe('resuming parent state yielding through synthesized state yielding from stored child state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      // foo
      dispatcher.use('foo', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          req.state.y = req.yieldState.y;
          req.state.z = req.yieldState.z;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      // bar
      dispatcher.use('bar', null, [
        function(req, res, next) {
          res.__text += ' ' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt();
        },
        function(err, req, res, next) {
          res.__text += ' E:' + req.state.name + '(' + req.yieldState.name + ')';
          res.completePrompt(err);
        }
      ]);
      
      dispatcher.transition('bar', 'baz', [
        function(req, res, next) {
          req.state.z = req.yieldState.z;
          res.__text += ' --' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        },
        function(err, req, res, next) {
          res.__text += ' --E:' + req.yieldState.name + '/' + req.state.name + '-->';
          next();
        }
      ]);
      
      function handler(req, res, next) {
        res.__text = req.state.name;
        next();
      }
      
      
      chai.express.handler(dispatcher.flow('baz', handler, { through: 'bar' }))
        .req(function(req) {
          request = req;
          request.body = { state: 'H2' };
          request.session = { state: {} };
          request.session.state['H1'] = { name: 'foo', x: 1 };
          request.session.state['H2'] = { name: 'baz', z: 3, prev: 'H1' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .next(function(err) {
          console.log(err);
          done(err);
        })
        .dispatch();
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state.handle).to.equal('H1');
      expect(request.state).to.deep.equal({
        name: 'foo',
        x: 1,
        y: undefined,
        z: 3
      });
    });
    
    it('should set yieldState', function() {
      expect(request.yieldState).to.be.an('object');
      expect(request.yieldState).to.deep.equal({
        name: 'bar',
        z: 3,
        prev: 'H1'
      });
    });
    
    it('should remove completed state from session', function() {
      expect(request.session).to.deep.equal({
        state: {
          'H1': {
            name: 'foo',
            x: 1
          }
        }
      });
    });
    
    it('should respond', function() {
      expect(response._data).to.equal('baz --baz/bar--> bar(baz) --bar/foo--> foo(bar)');
    });
  }); // resuming parent state yielding through synthesized state yielding from stored child state
  
  // THIS IS AN ERROR SOMEWHERE
  describe.skip('resuming parent state after transition through synthesized state from loaded, named state', function() {
    
    var request, response, err;
    before(function(done) {
      var dispatcher = new Dispatcher();
      
      dispatcher.use('foo', null, [
        function(req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          res.__text += 'foo';
          res.end(res.__text);
        },
        function(err, req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          res.__text += 'EFOO';
          res.end(res.__text);
        }
      ]);
      
      dispatcher.transition('foo', 'bar', [
        function(req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          req.state.y = req.yieldState.y;
          res.__text += ' --bar/foo--> ';
          next();
        },
        function(err, req, res, next) {
          if (req.state.name !== 'foo') { return next(new Error('incorrect state')); }
          if (req.yieldState.name !== 'bar') { return next(new Error('incorrect yield state')); }
          
          res.__text += ' --EBAR/EFOO--> ';
          next();
        }
      ]);
      
      
      chai.express.handler(dispatcher.flow())
        .req(function(req) {
          request = req;
          request.state = { handle: '22345678', name: 'baz', z: 3, prev: '12345678' };
          request.session = { state: {} };
          request.session.state['12345678'] = { name: 'foo', x: 1 };
          request.session.state['22345678'] = { name: 'baz', z: 3, prev: '12345678' };
        })
        .res(function(res) {
          res.__text = 'bar'
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
        x: 1,
        y: 2
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
      expect(response._data).to.equal('bar --bar/foo--> foo');
    });
  }); // resuming parent state after transition through synthesized state from loaded, named state
  
});
