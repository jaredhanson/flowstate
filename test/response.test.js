var expect = require('chai').expect;
var chai = require('chai')
  , sinon = require('sinon')
  , state = require('../lib/middleware/state')
  , SessionStore = require('../lib/store/session');


describe('Response', function() {
  
  describe('#redirect', function() {
    
    it('should call next with error when state fails to be destroyed', function(done) {
      var store = new SessionStore();
      sinon.spy(store, 'get');
      sinon.spy(store, 'set');
      sinon.stub(store, 'destroy').yieldsAsync(new Error('something went wrong'));

      function handler(req, res, next) {
        res.redirect('/account/change-password');
      }
    
      chai.express.use([ state({ store: store }), handler ])
        .request(function(req, res) {
          req.method = 'POST';
          req.url = '/login/password';
          req.headers = {
            'host': 'server.example.com',
            'referer': 'https://server.example.com/login/password?state=11111111'
          }
          req.connection = { encrypted: true };
          req.body = { username: 'Aladdin', password: 'open sesame', state: '11111111' };
          req.session = {};
          req.session.state = {};
          req.session.state['00000000'] = {
            location: 'https://server.example.com/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          };
          req.session.state['11111111'] = {
            location: 'https://server.example.com/login/password',
            messages: [ 'Invalid username or password.' ],
            resumeState: '00000000'
          };
        })
        .next(function(err, req, res) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.equal('something went wrong');
          
          expect(store.get).to.have.callCount(1);
          expect(store.set).to.have.callCount(0);
          expect(store.destroy).to.have.callCount(1);
        
          expect(req.session).to.deep.equal({
            state: {
              '00000000': {
                location: 'https://server.example.com/authorize/continue',
                clientID: 's6BhdRkqt3',
                redirectURI: 'https://client.example.com/cb',
                state: 'xyz'
              },
              '11111111': {
                location: 'https://server.example.com/login/password',
                messages: [ 'Invalid username or password.' ],
                resumeState: '00000000'
              }
            }
          });
          
          done();
        })
        .listen();
    }); // should call next with error when state fails to be destroyed
    
  }); // #redirect
  
  describe('#render', function() {
    
    it('should call next with error when state fails to be set', function(done) {
      var store = new SessionStore();
      sinon.spy(store, 'get');
      sinon.stub(store, 'set').yieldsAsync(new Error('something went wrong'));
      sinon.spy(store, 'destroy');

      function handler(req, res, next) {
        expect(req.state).to.deep.equal({
          location: 'https://server.example.com/login/password',
          resumeState: '00000000'
        });
        req.state.messages = req.session.messages || [];
        req.state.messages.push('Invalid username or password.');
        res.status(403).render('/login/password');
      }
    
      function redirect(req, res, next) {
        res.redirect('/home')
      }
    
      chai.express.use([ state({ store: store, genh: function() { return '11111111' } }), handler, redirect ])
        .request(function(req, res) {
          req.method = 'POST';
          req.url = '/login/password';
          req.headers = {
            'host': 'server.example.com',
            'referer': 'https://server.example.com/login/password?state=00000000'
          }
          req.connection = { encrypted: true };
          req.body = { username: 'Aladdin', password: 'open sesame', state: '00000000' };
          req.session = {};
          req.session.state = {};
          req.session.state['00000000'] = {
            location: 'https://server.example.com/authorize/continue',
            clientID: 's6BhdRkqt3',
            redirectURI: 'https://client.example.com/cb',
            state: 'xyz'
          };
        })
        .next(function(err, req, res) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.equal('something went wrong');
          
          expect(store.get).to.have.callCount(1);
          expect(store.set).to.have.callCount(1);
          expect(store.destroy).to.have.callCount(0);
        
          expect(req.session).to.deep.equal({
            state: {
              '00000000': {
                location: 'https://server.example.com/authorize/continue',
                clientID: 's6BhdRkqt3',
                redirectURI: 'https://client.example.com/cb',
                state: 'xyz'
              }
            }
          });
        
          done();
        })
        .listen();
    }); // should call next with error when state fails to be set
    
  });
  
});
