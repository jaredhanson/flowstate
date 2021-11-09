var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../../lib/middleware/state')
  , SessionStore = require('../../../lib/store/session')


describe('POST /account/select', function() {
  
  it('should initialize state with state body parameter and resume state with yielded parameters', function(done) {
    var store = new SessionStore();
    sinon.spy(store, 'get');
    sinon.spy(store, 'save');
    sinon.spy(store, 'set');
    sinon.spy(store, 'destroy');

    function handler(req, res, next) {
      expect(req.state).to.deep.equal({
        location: 'https://server.example.com/account/select',
        resumeState: '00000000'
      });
      
      res.resumeState({
        selectedSession: req.body.selected_session
      }, next);
    }
    
    function redirect(req, res, next) {
      res.redirect('/home')
    }
  
    chai.express.use([ state({ store: store }), handler, redirect ])
      .request(function(req) {
        req.method = 'POST';
        req.url = '/account/select';
        req.headers = {
          'host': 'server.example.com'
        }
        req.connection = { encrypted: true };
        req.body = { selected_session: 'a001', state: '00000000' };
        req.session = {};
        req.session.state = {};
        req.session.state['00000000'] = {
          location: 'https://server.example.com/authorize/continue',
          clientID: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          state: 'xyz'
        };
      })
      .finish(function() {
        expect(store.get).to.have.callCount(2); // FIXME: this should only load once?
        expect(store.save).to.have.callCount(0);
        expect(store.set).to.have.callCount(1);
        expect(store.destroy).to.have.callCount(0);
        
        expect(this.req.session).to.deep.equal({
          state: {
            '00000000': {
              location: 'https://server.example.com/authorize/continue',
              clientID: 's6BhdRkqt3',
              redirectURI: 'https://client.example.com/cb',
              state: 'xyz',
              selectedSession: 'a001'
            }
          }
        });
        
        expect(this.statusCode).to.equal(302);
        expect(this.getHeader('Location')).to.equal('https://server.example.com/authorize/continue?state=00000000');
        done();
      })
      .listen();
  }); // should initialize state with state body parameter and resume state with yielded parameters
  
});
