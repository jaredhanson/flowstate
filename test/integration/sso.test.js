var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('integration: SSO', function() {
  
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
          returnTo: '/home',
          provider: 'http://server.example.com'
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
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.an('object'); // FIXME: remove yieldState
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/report/magic-quadrant?state=Dxh5N7w_wMQ');
      });
    }); // and returning to report with preserved state
    
    describe('and returning to report with preserved state by using array notation', function() {
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
          next();
        }
      
        chai.express.handler(dispatcher.flow([ handler ]))
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
  
      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.an('object'); // FIXME: remove yieldState
      });
  
      it('should redirect', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/report/magic-quadrant?state=Dxh5N7w_wMQ');
      });
    }); // and returning to report with preserved state by using array notation
    
    describe('and returning to report with preserved state and session established by default handler', function() {
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
          next();
        }
      
        function defaultHandler(req, res, next) {
          req.session.user = { id: req.federatedUser.id };
          next();
        }
      
        chai.express.handler(dispatcher.flow([ handler ], [ defaultHandler ]))
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
    
    describe('and returning to report with state updated by yield handler', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
        // TODO: test case with array notation.  multiple middleewares without array
        // TODO: set params, in the yeild, allow param notation in the route
      dispatcher.yield('/report/magic-quadrant', '/oauth2/redirect',
        function(req, res, next) {
          req.state.accounts.push(req.federatedUser);
          next();
        });
    
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
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
        expect(dispatcher._store.update).to.have.callCount(1);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set properties on request', function() {
        expect(request.federatedUser).to.be.an('object');
        expect(request.federatedUser).to.deep.equal({ id: '248289761001', provider: 'http://server.example.com' });
      });
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          accounts: [
            { id: '1207059', provider: 'https://www.facebook.com' },
            { id: '248289761001', provider: 'http://server.example.com' }
          ]
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              accounts: [
                { id: '1207059', provider: 'https://www.facebook.com' },
                { id: '248289761001', provider: 'http://server.example.com' }
              ]
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
    }); // and returning to report with state updated by yield handler
    
    describe.skip('and returning to report with state updated by yield handler that overrides default handler', function() {
      var dispatcher = new Dispatcher()
        , request, response, err;
    
        // TODO: test case with array notation.  multiple middleewares without array
        // TODO: set params, in the yeild, allow param notation in the route
      dispatcher.yield('/report/magic-quadrant', '/oauth2/redirect',
        function(req, res, next) {
          req.state.accounts.push(req.federatedUser);
          next();
        });
    
    
      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });
    
      before(function(done) {
        function handler(req, res, next) {
          req.federatedUser = { id: '248289761001', provider: 'http://server.example.com' };
          next();
        }
        
        function defaultHandler(req, res, next) {
          req.session.user = { id: req.federatedUser.id };
          next();
        }
      
        chai.express.handler(dispatcher.flow([ handler ], [ defaultHandler ]))
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
        expect(dispatcher._store.update).to.have.callCount(1);
        expect(dispatcher._store.destroy).to.have.callCount(1);
      });
    
      it('should set properties on request', function() {
        expect(request.federatedUser).to.be.an('object');
        expect(request.federatedUser).to.deep.equal({ id: '248289761001', provider: 'http://server.example.com' });
      });
    
      it('should update state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          accounts: [
            { id: '1207059', provider: 'https://www.facebook.com' },
            { id: '248289761001', provider: 'http://server.example.com' }
          ]
        });
      });
    
      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'Dxh5N7w_wMQ': {
              accounts: [
                { id: '1207059', provider: 'https://www.facebook.com' },
                { id: '248289761001', provider: 'http://server.example.com' }
              ]
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
    }); // and returning to report with state updated by yield handler that overrides default handler
  
  }); // redirect back from OAuth 2.0 authorization server
  
  describe('redirect back from OAuth service provider', function() {
    
    describe('and returning to report with preserved state and session established by default handler', function() {
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
          next();
        }
      
        function defaultHandler(req, res, next) {
          req.session.user = { id: req.federatedUser.id };
          next();
        }
      
        chai.express.handler(dispatcher.flow([ handler ], [ defaultHandler ], { getHandle: function(req) { return 'oauth_' + req.query.oauth_token; } }))
          .req(function(req) {
            request = req;
            request.method = 'GET';
            request.url = '/oauth/callback?oauth_token=XXXXXXXX&oauth_verifier=YYYYYYYY';
            request.query = { oauth_token: 'XXXXXXXX', oauth_verifier: 'VVVVVVVV' };
            request.session = {};
            request.session.state = {};
            request.session.state['oauth_XXXXXXXX'] = {
              provider: 'http://server.example.com',
              returnTo: '/report/magic-quadrant',
              state: 'Dxh5N7w_wMQ',
              tokenSecret: 'XXXXXXXX-XXXXXXXX'
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
    }); // and returning home with preserved state after default handling
    
  }); // redirect back from OAuth service provider
  
});
