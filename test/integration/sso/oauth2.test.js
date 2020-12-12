var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../../lib/manager')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/stores/session')

  // TODO: Move this to login/federated
describe('integration: sso/oauth2', function() {
  
  describe('redirecting to authorization server', function() {
    
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
          res.pushState({
            provider: 'https://server.example.com'
          }, 'https://client.example.com/cb', false);
          res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
        }
        
        chai.express.handler([state({ store: store }), handler])
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
            
            request = req;
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com';
            request.headers = {
              'host': 'client.example.com',
              'referer': 'https://client.example.com/'
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
        expect(store.save).to.have.callCount(1);
        expect(store.update).to.have.callCount(0);
        expect(store.destroy).to.have.callCount(0);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'https://server.example.com',
          returnTo: 'https://client.example.com/'
        });
      });
      
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'XXXXXXXX': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://client.example.com/'
            }
          }
        });
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=XXXXXXXX');
      });
    }); // from referring page
    
    describe('with return_to parameter', function() {
      var dispatcher = new Dispatcher({ genh: function() { return 'XXXXXXXX' } })
        , request, response, err;
  
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
  
      before(function(done) {
        function handler(req, res, next) {
          res.pushState({
            provider: 'https://server.example.com'
          }, 'https://client.example.com/cb', false);
          res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb');
        }
    
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            request = req;
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fclient.example.com/welcome';
            request.headers = {
              'host': 'client.example.com',
              'referer': 'https://client.example.com/signup'
            }
            request.query = { provider: 'https://server.example.com', return_to: 'https://client.example.com/welcome' };
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


      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(0);
        expect(dispatcher._store.save).to.have.callCount(1);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'https://server.example.com',
          returnTo: 'https://client.example.com/welcome'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'XXXXXXXX': {
              location: 'https://client.example.com/cb',
              provider: 'https://server.example.com',
              returnTo: 'https://client.example.com/welcome'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fclient.example.com%2Fcb&state=XXXXXXXX');
      });
    }); // with return_to parameter
    
    describe('with state', function() {
      var dispatcher = new Dispatcher({ genh: function() { return 'XXXXXXXX' } })
        , request, response, err;
  
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
  
      before(function(done) {
        function handler(req, res, next) {
          res.pushState({
            provider: 'https://server.example.net'
          }, 'https://server.example.com/cb', false);
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
        }
    
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            // TODO: this shouldn't load the state, since it is not intended for the
            //        /login/federated resource, but rather /continue.   Need to handle
            //       this on push state, to set the resume state to the parent state.
            request = req;
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
              location: '/continue',
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

      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });


      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        expect(dispatcher._store.save).to.have.callCount(1);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          resume: '00000000'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            '00000000': {
              location: '/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'XXXXXXXX': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              resume: '00000000'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=XXXXXXXX');
      });
    }); // with state
    
    describe('with state and return_to parameter', function() {
      var dispatcher = new Dispatcher({ genh: function() { return 'XXXXXXXX' } })
        , request, response, err;
  
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
  
      before(function(done) {
        function handler(req, res, next) {
          res.pushState({
            provider: 'https://server.example.net'
          }, 'https://server.example.com/cb', false);
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb');
        }
    
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            request = req;
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
              location: '/continue',
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

      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });


      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        expect(dispatcher._store.save).to.have.callCount(1);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });
  
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'https://server.example.net',
          resume: '00000000'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            '00000000': {
              location: '/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            },
            'XXXXXXXX': {
              location: 'https://server.example.com/cb',
              provider: 'https://server.example.net',
              resume: '00000000'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&redirect_uri=https%3A%2F%2Fserver.example.com%2Fcb&state=XXXXXXXX');
      });
    }); // with state and return_to parameter
    
  });
  
  describe('redirect from authorization server', function() {
  
    describe('and returning to location', function() {
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
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          res.resumeState();
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
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
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(1);
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
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://client.example.com/');
      });
    }); // and returning to location
    
    describe('and returning to location yeilding parameters', function() {
      var dispatcher = new Dispatcher({ genh: function() { return 'XXXXXXXX' } })
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          res.resumeState({
            flag: true
          });
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
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
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(1);
        expect(dispatcher._store.save).to.have.callCount(1);
        expect(dispatcher._store.update).to.have.callCount(0);
        // FIXME: destroy shouldn't be called here?
        expect(dispatcher._store.destroy).to.have.callCount(1);
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
              flag: true
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://client.example.com/?state=XXXXXXXX');
      });
    }); // and returning to location yeilding parameters
    
    describe('and resuming state', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          res.resumeState();
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
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
              resume: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              location: '/continue',
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
  
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://client.example.com/cb',
          provider: 'http://server.example.com',
          resume: 'Dxh5N7w_wMQ'
        });
      });
    
      it('should remove state from session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              location: '/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz'
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/continue?state=Dxh5N7w_wMQ');
      });
    }); // and resuming state
    
    describe('and resuming state yeilding parameters', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.net' };
          res.resumeState({ amount: 123.50 });
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
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
              resume: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              location: '/continue',
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
  
      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });
  
  
      it('should correctly invoke state store', function() {
        expect(dispatcher._store.load).to.have.callCount(2);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(1);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          location: 'https://server.example.com/cb',
          provider: 'http://server.example.net',
          resume: 'Dxh5N7w_wMQ'
        });
      });
    
      it('should remove state from session and update resuming state', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              location: '/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz',
              amount: 123.50
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/continue?state=Dxh5N7w_wMQ');
      });
    }); // and resuming state yeilding parameters
    
    // TODO: Test case for popping return data into state and/or query params
    //       (for example, when a session is not established, but the return to page needs info)
    
    // FIXME: make sure this is testing for correct behavior
    //        broke as a result fo removing _yield from Manager
     //        (same problem in oauth1 tests)
    describe.skip('and returning to report with preserved state and session established by default handler', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        // TODO: test case with multiple handlers
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          req.state.complete();
          next();
        }
      
        function defaultHandler(req, res, next) {
          console.log('DEFAULT HANDLER IS!');
          
          req.session.user = { id: req.federatedUser.id };
          next();
        }
      
        chai.express.handler(dispatcher.flow(handler, [ defaultHandler ]))
          .req(function(req) {
            request = req;
            request.method = 'GET';
            request.url = '/oauth2/redirect?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              provider: 'http://server.example.com',
              returnTo: '/report/magic-quadrant',
              state: 'Dxh5N7w_wMQ'
            };
            request.session.state['Dxh5N7w_wMQ'] = {
              accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
            };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .next(function(err) {
            console.log(err)
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
        expect(dispatcher._store.load).to.have.callCount(2);
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set properties on request', function() {
        expect(request.federatedUser).to.be.an('object');
        expect(request.federatedUser).to.deep.equal({ id: '248289761001', provider: 'http://server.example.com' });
      });
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          user: { id: '248289761001' },
          state: {
            'Dxh5N7w_wMQ': {
              accounts: [ { id: '1207059', provider: 'https://www.facebook.com' } ]
            }
          }
        });
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.an('object'); // FIXME: remove yieldState
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/report/magic-quadrant?state=Dxh5N7w_wMQ');
      });
    }); // and returning to report with preserved state and session established by default handler
  
  }); // redirect back from OAuth 2.0 authorization server
  
});
