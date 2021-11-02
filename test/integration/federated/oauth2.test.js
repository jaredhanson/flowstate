var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session')

  // TODO: Move this to login/federated
describe('integration: sso/oauth2', function() {
  
  describe('GET /login/federated', function() {
    
    it('should initialize state with referrer header and redirect with state', function(done) {
      var store = new SessionStore({ genh: function() { return 'xyz' } });
      sinon.spy(store, 'load');
      sinon.spy(store, 'save');
      sinon.spy(store, 'update');
      sinon.spy(store, 'destroy');
  
      function handler(req, res, next) {
        res.pushState({
          provider: 'https://server.example.com'
        }, 'https://client.example.com/cb', false);
        res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
      }
      
      chai.express.use([ state({ store: store }), handler ])
        .request(function(req, res) {
          req.method = 'GET';
          req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com';
          req.headers = {
            'host': 'client.example.com',
            'referer': 'https://client.example.com/login'
          }
          req.connection = { encrypted: true };
          req.query = { provider: 'https://server.example.com' };
          req.session = {};
        })
        .finish(function() {
          expect(store.load).to.have.callCount(0);
          expect(store.save).to.have.callCount(1);
          expect(store.update).to.have.callCount(0);
          expect(store.destroy).to.have.callCount(0);
          
          expect(this.req.state).to.deep.equal({
            location: 'https://client.example.com/cb',
            provider: 'https://server.example.com',
            returnTo: 'https://client.example.com/login'
          });
          expect(this.req.session).to.deep.equal({
            state: {
              'xyz': {
                location: 'https://client.example.com/cb',
                provider: 'https://server.example.com',
                returnTo: 'https://client.example.com/login'
              }
            }
          });
          
          expect(this.statusCode).to.equal(302);
          expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
          done();
        })
        .listen();
    }); // should initialize state with referrer header and redirect with state
    
    it('should initialize state with return to query parameter in preference to referrer header and redirect with state', function(done) {
      var store = new SessionStore({ genh: function() { return 'xyz' } });
      sinon.spy(store, 'load');
      sinon.spy(store, 'save');
      sinon.spy(store, 'update');
      sinon.spy(store, 'destroy');

      function handler(req, res, next) {
        res.pushState({
          provider: 'https://server.example.com'
        }, 'https://client.example.com/cb', false);
        res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
      }
  
      chai.express.use([ state({ store: store }), handler ])
        .request(function(req, res) {
          req.method = 'GET';
          req.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fclient.example.com/welcome';
          req.headers = {
            'host': 'client.example.com',
            'referer': 'https://client.example.com/login'
          }
          req.connection = { encrypted: true };
          req.query = { provider: 'https://server.example.com', return_to: 'https://client.example.com/welcome' };
          req.session = {};
        })
        .finish(function() {
          expect(store.load).to.have.callCount(0);
          expect(store.save).to.have.callCount(1);
          expect(store.update).to.have.callCount(0);
          expect(store.destroy).to.have.callCount(0);
          
          expect(this.req.state).to.deep.equal({
            location: 'https://client.example.com/cb',
            provider: 'https://server.example.com',
            returnTo: 'https://client.example.com/welcome'
          });
          expect(this.req.session).to.deep.equal({
            state: {
              'xyz': {
                location: 'https://client.example.com/cb',
                provider: 'https://server.example.com',
                returnTo: 'https://client.example.com/welcome'
              }
            }
          });
          
          expect(this.statusCode).to.equal(302);
          expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=xyz');
          done();
        })
        .listen();
    }); // should initialize state with return to query parameter in preference to referrer header and redirect with state
    
    describe('with state parameter', function() {
      var store = new SessionStore({ genh: function() { return 'xyz' } })
        , request, response, err;
  
      before(function() {
        sinon.spy(store, 'load');
        sinon.spy(store, 'save');
        sinon.spy(store, 'update');
        sinon.spy(store, 'destroy');
      });
  
      before(function(done) {
        function handler(req, res, next) {
          res.pushState({
            provider: 'https://server.example.net'
          }, 'https://server.example.com/cb', false);
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
        }
    
        chai.express.use([ state({ store: store }), handler ])
          .request(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            // TODO: this shouldn't load the state, since it is not intended for the
            //        /login/federated resource, but rather /continue.   Need to handle
            //       this on push state, to set the resume state to the parent state.
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
            request.headers = {
              'host': 'server.example.com',
              'referer': 'https://server.example.com/login?state=00000000'
            }
            request.query = { provider: 'https://server.example.net', state: '00000000' };
            request.session = {};
            request.session.state = {};
            request.session.state['00000000'] = {
              location: 'https://server.example.com/oauth2/authorize/continue',
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
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          state: '00000000'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/oauth2/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'xyz': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              state: '00000000'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=xyz');
      });
    }); // with state parameter
    
    describe('with state and return_to parameter', function() {
      var store = new SessionStore({ genh: function() { return 'xyz' } })
        , request, response, err;
  
      before(function() {
        sinon.spy(store, 'load');
        sinon.spy(store, 'save');
        sinon.spy(store, 'update');
        sinon.spy(store, 'destroy');
      });
  
      before(function(done) {
        function handler(req, res, next) {
          res.pushState({
            provider: 'https://server.example.net'
          }, 'https://server.example.com/cb', false);
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
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
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&return_to=https%3A%2F%2Fserver.example.com/welcome&state=00000000';
            request.headers = {
              'host': 'server.example.com',
              'referer': 'https://server.example.com/login?state=00000000'
            }
            request.query = { provider: 'https://server.example.net', return_to: 'https://server.example.com/welcome', state: '00000000' };
            request.session = {};
            request.session.state = {};
            request.session.state['00000000'] = {
              location: 'https://server.example.com/oauth2/authorize/continue',
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
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          state: '00000000'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/oauth2/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'xyz': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              state: '00000000'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=xyz');
      });
    }); // with state and return_to parameter
    
    // FIXME: This test needs reviewing
    describe('with state intended for this resource', function() {
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
          console.log('**** STATE');
          console.log(req.state)
          
          req.state.complete();
          
          res.pushState({
            provider: 'https://server.example.net'
          }, 'https://server.example.com/cb', false);
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
        }
    
        chai.express.use([state({ store: store }), handler])
          .request(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            // TODO: this shouldn't load the state, since it is not intended for the
            //        /login/federated resource, but rather /continue.   Need to handle
            //       this on push state, to set the resume state to the parent state.
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
            request.headers = {
              'host': 'server.example.com',
              'referer': 'https://server.example.com/login?state=00000000'
            }
            request.query = { provider: 'https://server.example.net', state: '00000000' };
            request.session = {};
            request.session.state = {};
            request.session.state['00000000'] = {
              location: 'https://server.example.com/login/federated',
              provider: 'https://myshopify.com',
              shop: 'example.myshopify.com',
              returnTo: '/'
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
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          returnTo: '/'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            // FIXME: This is the complted state, and should be removed from session
            '00000000': {
              location: 'https://server.example.com/login/federated',
              provider: 'https://myshopify.com',
              shop: 'example.myshopify.com',
              returnTo: '/'
            },
            'XXXXXXXX': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              returnTo: '/'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=XXXXXXXX');
      });
    }); // with state intended for this resource
    
  });
  
  describe('GET /oauth2/redirect', function() {
  
    describe('and returning to location', function() {
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
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          res.resumeState(next);
        }
        
        function redirect(req, res, next) {
          res.redirect('/home')
        }
      
        chai.express.use([ state({ store: store }), handler, redirect ])
          .request(function(req) {
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.headers = {
              'host': 'client.example.com'
            }
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              location: 'https://client.example.com/cb',
              provider: 'http://server.example.com',
              returnTo: 'https://client.example.com/'
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
        expect(store.destroy).to.have.callCount(1);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/'
        });
      });
      
      it('should remove state from session', function() {
        expect(request.session).to.deep.equal({});
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://client.example.com/');
      });
    }); // and returning to location
    
    describe('and returning to location yeilding parameters', function() {
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
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          res.resumeState({
            beep: 'boop'
          }, next);
        }
        
        function redirect(req, res, next) {
          res.redirect('/home')
        }
      
        chai.express.use([ state({ store: store }), handler, redirect ])
          .request(function(req) {
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.headers = {
              'host': 'client.example.com'
            }
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              location: 'https://client.example.com/cb',
              provider: 'http://server.example.com',
              returnTo: 'https://client.example.com/'
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
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        // FIXME: destroy shouldn't be called here?
        expect(store.destroy).to.have.callCount(1);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          returnTo: 'https://client.example.com/'
        });
      });
      
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'XXXXXXXX': {
              location: 'https://client.example.com/',
              beep: 'boop'
            }
          }
        });
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://client.example.com/?state=XXXXXXXX');
      });
    }); // and returning to location yeilding parameters
    
    describe('and resuming state', function() {
      var store = new SessionStore()
        , request, response, err;
    
      before(function() {
        sinon.spy(store, 'load');
        sinon.spy(store, 'save');
        sinon.spy(store, 'update');
        sinon.spy(store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          res.resumeState(next);
        }
        
        function redirect(req, res, next) {
          res.redirect('/home')
        }
      
        chai.express.use([ state({ store: store }), handler, redirect ])
          .request(function(req) {
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.headers = {
              'host': 'client.example.com'
            }
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              location: 'https://client.example.com/cb',
              provider: 'http://server.example.com',
              state: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              location: 'https://client.example.com/oauth2/authorize/continue',
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
        expect(store.load).to.have.callCount(2);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(1);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          state: 'Dxh5N7w_wMQ'
        });
      });
    
      it('should remove state from session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              location: 'https://client.example.com/oauth2/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            }
          }
        });
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://client.example.com/oauth2/authorize/continue?state=Dxh5N7w_wMQ');
      });
    }); // and resuming state
    
    describe('and resuming state yeilding parameters', function() {
      var store = new SessionStore()
        , request, response, err;
    
      before(function() {
        sinon.spy(store, 'load');
        sinon.spy(store, 'save');
        sinon.spy(store, 'update');
        sinon.spy(store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.net' };
          res.resumeState({ beep: 'boop' }, next);
        }
        
        function redirect(req, res, next) {
          res.redirect('/home')
        }
      
        chai.express.use([ state({ store: store }), handler, redirect ])
          .request(function(req) {
            request = req;
            request.connection = { encrypted: true };
            request.method = 'GET';
            request.url = '/cb?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.headers = {
              'host': 'server.example.com'
            }
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              location: 'https://server.example.com/cb',
              provider: 'http://server.example.net',
              state: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              location: 'https://server.example.com/oauth2/authorize/continue',
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
        expect(store.load).to.have.callCount(2);
        expect(store.save).to.have.callCount(0);
        expect(store.update).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(1);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'http://server.example.net',
          state: 'Dxh5N7w_wMQ'
        });
      });
    
      it('should remove state from session and update resuming state', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              location: 'https://server.example.com/oauth2/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz',
              beep: 'boop'
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.com/oauth2/authorize/continue?state=Dxh5N7w_wMQ');
      });
    }); // and resuming state yeilding parameters
    
    // TODO: Test case without returnTo
    
    // TODO: Test case for popping return data into state and/or query params
    //       (for example, when a session is not established, but the return to page needs info)
  
  }); // redirect back from OAuth 2.0 authorization server
  
});
