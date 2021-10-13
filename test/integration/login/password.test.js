var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('GET /login/password', function() {
    
  describe('without parameters', function() {
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
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login/password';
          request.headers = {
            'host': 'server.example.com'
          }
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
      expect(request.state).to.deep.equal({});
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should render', function() {
      expect(response.statusCode).to.equal(200);
      expect(response).to.render('login/password');
      expect(response.locals).to.deep.equal({});
    });
  }); // without parameters
  
  describe('with referrer', function() {
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
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login/password';
          request.headers = {
            'host': 'server.example.com',
            'referer': 'https://server.example.com/'
          }
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
        returnTo: 'https://server.example.com/'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should render', function() {
      expect(response.statusCode).to.equal(200);
      expect(response).to.render('login/password');
      expect(response.locals).to.deep.equal({
        returnTo: 'https://server.example.com/'
      });
    });
  }); // with referrer
  
  describe('with return_to parameter', function() {
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
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login/password';
          request.query = { return_to: 'https://www.example.com/welcome' };
          request.headers = {
            'host': 'server.example.com'
          }
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
        returnTo: 'https://www.example.com/welcome'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should render', function() {
      expect(response.statusCode).to.equal(200);
      expect(response).to.render('login/password');
      expect(response.locals).to.deep.equal({
        returnTo: 'https://www.example.com/welcome'
      });
    });
  }); // with return_to parameter
  
  describe('with return_to parameter and referrer', function() {
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
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login/password';
          request.query = { return_to: 'https://www.example.com/welcome' };
          request.headers = {
            'host': 'server.example.com',
            'referer': 'https://server.example.com/'
          }
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
        returnTo: 'https://www.example.com/welcome'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should render', function() {
      expect(response.statusCode).to.equal(200);
      expect(response).to.render('login/password');
      expect(response.locals).to.deep.equal({
        returnTo: 'https://www.example.com/welcome'
      });
    });
  }); // with return_to parameter and referrer
  
  describe('with state parameter', function() {
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
      
      chai.express.handler([ state({ store: store }), handler ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
          
          request = req;
          request.connection = { encrypted: true };
          request.method = 'GET';
          request.url = '/login/password?state=00000000';
          request.headers = {
            'host': 'server.example.com',
            'referer': 'https://server.example.com/'
          }
          request.query = { state: '00000000' };
          request.session = {};
          request.session.state = {};
          request.session.state['00000000'] = {
            location: 'https://www.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });


    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(1);
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        state: '00000000'
      });
    });
    
    it('should preserve state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          '00000000': {
            location: 'https://www.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          }
        }
      });
    });

    it('should render', function() {
      expect(response.statusCode).to.equal(200);
      expect(response).to.render('login/password');
      expect(response.locals).to.deep.equal({
        state: '00000000'
      });
    });
  }); // with state parameter
  
}); // GET /login/password
  
describe('POST /login/password', function() {
  
  describe('from same resource as referring page', function() {
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
        req.user = { id: '1000', username: 'Aladdin' };
        res.resumeState(next);
      }
      
      function redirect(req, res, next) {
        res.redirect('/home')
      }
  
      // TODO: Consider initializing state middleware with a default return to URL
      chai.express.handler([ state({ store: store }), handler, redirect ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
        
          request = req;
          request.connection = { encrypted: true };
          request.method = 'POST';
          request.url = '/login/password';
          request.headers = {
            'host': 'www.example.com',
            'referer': 'https://www.example.com/login/password'
          }
          request.body = { username: 'Aladdin', password: 'open sesame' };
          request.session = {};
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
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({});
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('/home');
    });
  }); // from same resource as referring page
  
  describe('with return_to parameter', function() {
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
        req.user = { id: '1000', username: 'Aladdin' };
        res.resumeState(next);
      }
      
      function redirect(req, res, next) {
        res.redirect('/home')
      }
  
      chai.express.handler([ state({ store: store }), handler, redirect ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
        
          request = req;
          request.connection = { encrypted: true };
          request.method = 'POST';
          request.url = '/login/password';
          request.headers = {
            'host': 'www.example.com',
            'referer': 'https://www.example.com/login/password'
          }
          request.body = { username: 'Aladdin', password: 'open sesame', return_to: 'https://www.example.com/' };
          request.session = {};
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
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        returnTo: 'https://www.example.com/'
      });
    });
    
    it('should not persist state in session', function() {
      expect(request.session).to.deep.equal({});
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('https://www.example.com/');
    });
  }); // with return_to parameter
  
  describe('with state parameter', function() {
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
        req.user = { id: '1000', username: 'Aladdin' };
        res.resumeState(next);
      }
      
      function redirect(req, res, next) {
        res.redirect('/home')
      }
      
      chai.express.handler([ state({ store: store }), handler, redirect ])
        .req(function(req) {
          req.header = function(name) {
            var lc = name.toLowerCase();
            return this.headers[lc];
          }
        
          request = req;
          request.connection = { encrypted: true };
          request.method = 'POST';
          request.url = '/login/password';
          request.headers = {
            'host': 'www.example.com',
            'referer': 'https://www.example.com/login/password'
          }
          request.body = { username: 'Aladdin', password: 'open sesame', state: '00000000' };
          request.session = {};
          request.session.state = {};
          request.session.state['00000000'] = {
            location: 'https://www.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
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


    it('should correctly invoke state store', function() {
      expect(store.load).to.have.callCount(2); // FIXME: should onl be called once
      expect(store.save).to.have.callCount(0);
      expect(store.update).to.have.callCount(0);
      expect(store.destroy).to.have.callCount(0);
    });
    
    it('should set state', function() {
      expect(request.state).to.be.an('object');
      expect(request.state).to.deep.equal({
        state: '00000000'
      });
    });
    
    it('should preserve state in session', function() {
      expect(request.session).to.deep.equal({
        state: {
          '00000000': {
            location: 'https://www.example.com/oauth2/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          }
        }
      });
    });

    it('should redirect', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('https://www.example.com/oauth2/authorize/continue?state=00000000');
    });
  }); // with state parameter
  
}); // POST /login/password
