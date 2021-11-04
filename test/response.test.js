var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../lib/middleware/state')
  , SessionStore = require('../lib/stores/session')


describe('Response', function() {
  
  describe('#pushState', function() {
    
    it('should push state with referrer header and redirect with state', function(done) {
      var store = new SessionStore({ genh: function() { return '00000000' } });
      sinon.spy(store, 'load');
      sinon.spy(store, 'save');
      sinon.spy(store, 'update');
      sinon.spy(store, 'destroy');

      function handler(req, res, next) {
        expect(req.state).to.deep.equal({});
        
        res.pushState({
          name: 'Jane Doe'
        }, 'https://www.example.com/hello');
      }
    
      chai.express.use([ state({ store: store }), handler ])
        .request(function(req, res) {
          req.method = 'GET';
          req.url = '/';
          req.headers = {
            'host': 'client.example.com'
          }
          req.connection = { encrypted: true };
          req.session = {};
        })
        .finish(function() {
          expect(store.load).to.have.callCount(0);
          expect(store.save).to.have.callCount(1);
          expect(store.update).to.have.callCount(0);
          expect(store.destroy).to.have.callCount(0);
        
          // FIXME: why is returnTo in the state?
          expect(this.req.state).to.deep.equal({
            location: 'https://www.example.com/hello',
            name: 'Jane Doe'
          });
          expect(this.req.session).to.deep.equal({
            state: {
              '00000000': {
                location: 'https://www.example.com/hello',
                name: 'Jane Doe'
              }
            }
          });
        
          expect(this.statusCode).to.equal(302);
          expect(this.getHeader('Location')).to.equal('https://www.example.com/hello?state=00000000');
          done();
        })
        .listen();
    }); // should store state with referrer header and redirect with state
    
  }); // #pushState
  
});
