var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../../lib/manager');

  // TODO: Move this to login/federated
describe('integration: sso/oauth2', function() {
  
  describe('redirecting to authorization service', function() {
    
    describe('from referring page', function() {
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
          req.state.provider = 'https://server.example.com';
          res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3');
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
            
            request = req;
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com';
            request.headers = {
              'host': 'www.example.com',
              'referer': 'https://www.example.com/dashboard'
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
          name: '/login/federated?provider=https%3A%2F%2Fserver.example.com',
          provider: 'https://server.example.com',
          returnTo: 'https://www.example.com/dashboard'
        });
      });
      
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'XXXXXXXX': {
              name: '/login/federated?provider=https%3A%2F%2Fserver.example.com',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/dashboard'
            }
          }
        });
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=XXXXXXXX');
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
          req.state.provider = 'https://server.example.com';
          res.redirect('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3');
        }
    
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            request = req;
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fwww.example.com/welcome';
            request.headers = {
              'host': 'www.example.com',
              'referer': 'https://www.example.com/signup'
            }
            request.query = { provider: 'https://server.example.com', return_to: 'https://www.example.com/welcome' };
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
          name: '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fwww.example.com/welcome',
          provider: 'https://server.example.com',
          returnTo: 'https://www.example.com/welcome'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'XXXXXXXX': {
              name: '/login/federated?provider=https%3A%2F%2Fserver.example.com&return_to=https%3A%2F%2Fwww.example.com/welcome',
              provider: 'https://server.example.com',
              returnTo: 'https://www.example.com/welcome'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('https://server.example.com/authorize?response_type=code&client_id=s6BhdRkqt3&state=XXXXXXXX');
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
          req.state.push({
            provider: 'https://server.example.net'
          });
          
          //req.state.provider = 'https://server.example.net';
          res.redirect('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3');
        }
    
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            req.header = function(name) {
              var lc = name.toLowerCase();
              return this.headers[lc];
            }
          
            request = req;
            request.method = 'GET';
            request.url = '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000';
            request.headers = {
              'host': 'server.example.com',
              'referer': 'https://server.example.com/login'
            }
            request.query = { provider: 'https://server.example.net', state: '00000000' };
            request.session = {};
            request.session.state = {};
            request.session.state['00000000'] = {
              returnTo: '/continue',
              clientID: 'af0ifjsldkj',
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
          provider: 'https://server.example.net',
          returnTo: '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000'
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            '00000000': {
              clientID: 'af0ifjsldkj',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz',
              returnTo: '/continue'
            },
            'XXXXXXXX': {
              provider: 'https://server.example.net',
              returnTo: '/login/federated?provider=https%3A%2F%2Fserver.example.net&state=00000000'
            }
          }
        });
      });

      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        //expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&state=XXXXXXXX');
        expect(response.getHeader('Location')).to.equal('https://server.example.net/authorize?response_type=code&client_id=s6BhdRkqt3&state=XXXXXXXX');
      });
    }); // with state
    
  });
  
  describe('redirect back from OAuth 2.0 authorization server', function() {
  
    describe('and returning home', function() {
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
          req.state.complete();
          next();
        }
      
        chai.express.handler(dispatcher.flow(handler))
          .req(function(req) {
            request = req;
            request.method = 'GET';
            request.url = '/oauth2/redirect?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj';
            request.query = { code: 'SplxlOBeZQQYbYS6WxSbIA', state: 'af0ifjsldkj' };
            request.session = {};
            request.session.state = {};
            request.session.state['af0ifjsldkj'] = {
              provider: 'http://server.example.com',
              returnTo: '/home'
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
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          provider: 'http://server.example.com',
          returnTo: '/home'
        });
      });
    
      // FIXME: this state should be removed
      it('should remove state from session', function() {
        expect(request.session).to.deep.equal({});
      });
    
      it('should not set locals', function() {
        expect(request.locals).to.be.undefined;
      });
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/home');
      });
    }); // and returning home
    
    describe('and returning to report with preserved state', function() {
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
      
        chai.express.handler(dispatcher.flow(handler))
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
    
      it('should remove state from session', function() {
        expect(request.session).to.deep.equal({
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
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/report/magic-quadrant?state=Dxh5N7w_wMQ');
      });
    }); // and returning to report with preserved state
    
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
