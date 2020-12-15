var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../../lib/manager')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('integration: login/password', function() {
  
  describe('prompting', function() {
    
    describe('from referring page', function() {
      var store = new SessionStore({ genh: function() { return 'XXXXXXXX' } })
        , request, response, err;
    
      before(function() {
        sinon.spy(store, 'load');
        sinon.spy(store, 'save');
        sinon.spy(store, 'update');
        sinon.spy(store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          res.render('login/password');
        }
        
        chai.express.handler([state({ store: store }), handler])
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
            
            request = req;
            request.method = 'GET';
            request.url = '/login/password';
            request.headers = {
              'host': 'www.example.com',
              'referer': 'https://www.example.com/'
            }
            request.query = { provider: 'https://server.example.com' };
            request.session = {};
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
  
  
      it('should correctly invoke state store', function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          returnTo: 'https://www.example.com/'
        });
      });
      
      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });
  
      it('should render', function() {
        expect(response.statusCode).to.equal(200);
        expect(response).to.render('login/password');
        expect(response.locals).to.deep.equal({
          returnTo: 'https://www.example.com/'
        });
      });
    }); // from referring page
    
  });
  
  // TODO: this needs work on the referer stuff
  describe('logging in', function() {
    var store = new SessionStore()
      , request, response, err;
  
    before(function() {
      sinon.spy(store, 'load');
      sinon.spy(store, 'save');
      sinon.spy(store, 'update');
      sinon.spy(store, 'destroy');
    });
  
    before(function(done) {
      function handler(req, res, next) {
        console.log('HANDLER!');
        console.log(req.state);
        
        req.user = { id: '1000', username: 'Aladdin' };
        //next();
        res.resumeState();
      }
    
      chai.express.handler([state({ store: store }), handler])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.method = 'POST';
          request.url = '/login/password';
          request.headers = {
            'host': 'www.example.com',
            'referer': 'https://www.example.com/login/password'
          }
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


    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(0);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('https://www.example.com/login/password');
    });
  }); // logging in
  
  // TODO: modify this for default handler, nexting
  /*
  describe.only('logging in', function() {
    var store = new SessionStore()
      , request, response, err;
  
    before(function() {
      sinon.spy(store, 'load');
      sinon.spy(store, 'save');
      sinon.spy(store, 'update');
      sinon.spy(store, 'destroy');
    });
  
    before(function(done) {
      function handler(req, res, next) {
        console.log('HANDLER!');
        console.log(req.state);
        
        req.user = { id: '1000', username: 'Aladdin' };
        //next();
        res.resumeState();
      }
    
      chai.express.handler([state({ store: store }), handler])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.method = 'POST';
          request.url = '/login/password';
          request.headers = {
            'host': 'www.example.com',
            'referer': 'https://www.example.com/login/password'
          }
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


    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(0);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(200);
    });
  }); // logging in
  */
  
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
      expect(dispatcher._store.destroy).to.have.callCount(0);
    });
    
    it('should preserve state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        client: 's6BhdRkqt3',
        redirectURI: 'https://client.example.com/cb',
        returnTo: '/oauth2/continue'
      });
    });

    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/login?state=nIeC6G7V8vA');
    });
  }); // logging in and continuing with preserved state
  
});
