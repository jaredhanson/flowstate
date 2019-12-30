var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../../lib/manager');


describe('integration: login/password', function() {
  
  describe('logging in', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler(req, res, next) {
        req.user = { id: '1000', username: 'Aladdin' };
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/login/password';
          request.body = { username: 'Aladdin', password: 'open sesame' };
        })
        .res(function(res) {
          response = res;
        })
        .next(function(err) {
          done(err);
        })
        .dispatch();
    });

    after(function() {
      dispatcher._store.destroy.restore();
      dispatcher._store.update.restore();
      dispatcher._store.save.restore();
      dispatcher._store.load.restore();
    });


    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(200);
    });
  }); // logging in
  
  describe('logging in and continuing', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler(req, res, next) {
        req.user = { id: '1000', username: 'Aladdin' };
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler, { continue: '/login' }))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/login/password';
          request.body = { username: 'Aladdin', password: 'open sesame' };
        })
        .res(function(res) {
          response = res;
        })
        .end(function(res) {
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


    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(0);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login');
    });
  }); // logging in and continuing
  
  describe('logging in and continuing with preserved state', function() {
    var dispatcher = new Dispatcher()
      , request, response, err;
  
    before(function() {
      sinon.spy(dispatcher._store, 'load');
      sinon.spy(dispatcher._store, 'save');
      sinon.spy(dispatcher._store, 'update');
      sinon.spy(dispatcher._store, 'destroy');
    });
  
    before(function(done) {
      function handler(req, res, next) {
        req.user = { id: '1000', username: 'Aladdin' };
        next();
      }
    
      chai.express.handler(dispatcher.flow(handler, { continue: '/login' }))
        .req(function(req) {
          request = req;
          request.method = 'POST';
          request.url = '/login/password';
          request.body = { username: 'Aladdin', password: 'open sesame', state: 'nIeC6G7V8vA' };
          request.session = {};
          request.session.state = {};
          request.session.state['nIeC6G7V8vA'] = {
            client: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            returnTo: '/oauth2/continue'
          };
        })
        .res(function(res) {
          response = res;
        })
        .end(function(res) {
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


    it('should correctly invoke state store', function() {
      expect(dispatcher._store.load).to.have.callCount(1);
      expect(dispatcher._store.save).to.have.callCount(0);
      expect(dispatcher._store.update).to.have.callCount(0);
      //expect(dispatcher._store.destroy).to.have.callCount(0);
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login');
    });
  }); // logging in and continuing with preserved state
  
});
