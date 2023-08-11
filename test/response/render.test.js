var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , state = require('../../lib/middleware/state')
  , SessionStore = require('../../lib/store/session');


describe('ServerResponse#render', function() {
  
  it('should render', function(done) {
    var store = new SessionStore();
    
    function handler(req, res, next) {
      res.render('home')
    }
  
    chai.express.use([ state({ store: store }), handler ])
      .request(function(req, res) {
        req.connection = { encrypted: true };
        req.method = 'GET';
        req.url = '/';
        req.headers = {
          'host': 'www.example.com'
        };
        req.query = {};
        req.session = {};
      })
      .finish(function() {
        expect(this).to.render('home')
                    .with.deep.locals({});
        expect(this.req.state).to.deep.equal({
          location: 'https://www.example.com/'
        });
        expect(this.req.session).to.deep.equal({})
        done();
      })
      .listen();
  }); // should render
  
});
