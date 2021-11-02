var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session');


describe('GET /login/password', function() {
    
  it('should initialize state without properties and render without state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com'
        }
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({});
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({});
        done();
      })
      .listen();
  }); // should initialize state without properties and render without state parameter
  
  it('should initialize state with referrer header and render with state', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login'
        }
        req.connection = { encrypted: true };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          returnTo: 'https://server.example.com/login'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://server.example.com/login' });
        done();
      })
      .listen();
  }); // should initialize state with referrer header and render with state
  
  it('should initialize state with return to query parameter and render with state', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com'
        }
        req.connection = { encrypted: true };
        req.query = { return_to: 'https://client.example.com/' };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://client.example.com/' });
        done();
      })
      .listen();
  }); // should initialize state with return to query parameter and render with state
  
  it('should initialize state with return to query parameter in preference to referrer header and render with state', function(done) {
    var store = new SessionStore()
    sinon.spy(store, 'load');
    sinon.spy(store, 'save');
    sinon.spy(store, 'update');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      res.render('login/password');
    }
    
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.method = 'GET';
        req.url = '/login/password';
        req.headers = {
          'host': 'server.example.com',
          'referer': 'https://server.example.com/login'
        }
        req.connection = { encrypted: true };
        req.query = { return_to: 'https://client.example.com/' };
        req.session = {};
      })
      .finish(function() {
        expect(store.load).to.have.callCount(0);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.state).to.deep.equal({
          returnTo: 'https://client.example.com/'
        });
        expect(this.req.session).to.deep.equal({});
        
        expect(this.statusCode).to.equal(200);
        expect(this).to.render('login/password')
                    .with.deep.locals({ returnTo: 'https://client.example.com/' });
        done();
      })
      .listen();
  }); // should initialize state with return to query parameter in preference to referrer header and render with state
  
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
      
      chai.express.use([ state({ store: store }), handler ])
        .request(function(req) {
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
        .finish(function() {
          response = this;
          done();
        })
        .listen();
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
      chai.express.use([ state({ store: store }), handler, redirect ])
        .request(function(req, res) {
          response = res;
          
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
        .finish(function() {
          done();
        })
        .listen();
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
  
      chai.express.use([ state({ store: store }), handler, redirect ])
        .request(function(req, res) {
          response = res;
          
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
        .finish(function() {
          done();
        })
        .listen();
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
      
      chai.express.use([ state({ store: store }), handler, redirect ])
        .request(function(req, res) {
          response = res;
          
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
        .finish(function() {
          done();
        })
        .listen();
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
