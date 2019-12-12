var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('integration: FLOW', function() {
    
  describe('with one handler', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler1))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with one handler
  
  describe('with two handlers', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler1, handler2))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with two handlers
  
  describe('with three handlers', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
      
      function handler3(req, res, next) {
        req.__.handlers.push(3);
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler1, handler2, handler3))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2, 3 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with three handlers
  
  describe('with three handlers and options', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
      
      function handler3(req, res, next) {
        req.__.handlers.push(3);
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler1, handler2, handler3, { beep: 'boop' }))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2, 3 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with three handlers and options
  
  describe('with three handlers, the first argument being a two element array', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
      
      function handler3(req, res, next) {
        req.__.handlers.push(3);
        next();
      }
    
      chai.express.handler(dispatcher.flow([ handler1, handler2 ], handler3))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2, 3 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with three handlers, the first argument being a two element array
  
  describe('with five handlers, the first two arguments being two element arrays', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
      
      function handler3(req, res, next) {
        req.__.handlers.push(3);
        next();
      }
      
      function handler4(req, res, next) {
        req.__.handlers.push(4);
        next();
      }
      
      function handler5(req, res, next) {
        req.__.handlers.push(5);
        next();
      }
    
      chai.express.handler(dispatcher.flow([ handler1, handler2 ], [ handler3, handler4 ], handler5))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2, 3, 4, 5 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with five handlers, the first two arguments being two element arrays
  
  describe('with one handler and one default handler', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
    
      chai.express.handler(dispatcher.flow([ handler1 ], [ handler2 ]))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with one handler and one default handler
  
  describe('with two handlers and two default handlers', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler1(req, res, next) {
        req.__ = req.__ || {};
        req.__.handlers = [];
        req.__.handlers.push(1);
        next();
      }
      
      function handler2(req, res, next) {
        req.__.handlers.push(2);
        next();
      }
      
      function handler3(req, res, next) {
        req.__.handlers.push(3);
        next();
      }
      
      function handler4(req, res, next) {
        req.__.handlers.push(4);
        next();
      }
    
      chai.express.handler(dispatcher.flow([ handler1, handler2 ], [ handler3, handler4 ]))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/resource';
          request.body = { return_to: '/' };
          request.session = {};
        })
        .end(function(res) {
          response = res;
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
    
  
    it('should set properties on request', function() {
      expect(request.__.handlers).to.deep.equal([ 1, 2, 3, 4 ]);
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/');
    });
  }); // with two handlers and two default handlers
  
});
