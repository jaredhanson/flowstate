var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , Dispatcher = require('../../lib/manager');


describe('Dispatcher#flow (externally-initiated)', function() {

  describe('prompting via redirect', function() {

    describe('without options', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.prompt('consent');
        }

        dispatcher.use('consent', { spawn: [
          function(req, res, next) {
            res.redirect(302, '/from/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should set locals', function() {
        expect(request.locals).to.deep.equal({});
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
      });
    }); // without options

    describe('with options', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.prompt('consent', { scope: 'test' });
        }

        dispatcher.use('consent', { spawn: [
          function(req, res, next) {
            res.redirect('/from/' + req.state.name + '?scope=' + req.locals.scope);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should set locals', function() {
        expect(request.locals).to.deep.equal({
          scope: 'test'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/consent?scope=test&state=H1');
      });
    }); // with options

    describe('after modifying state', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          req.state.x = 1;
          res.prompt('consent');
        }

        dispatcher.use('consent', { spawn: [
          function(req, res, next) {
            res.redirect('/from/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should set locals', function() {
        expect(request.locals).to.deep.equal({});
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              x: 1
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
      });
    }); // after modifying state

    describe('after saving state', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          req.state.x = 1;
          req.state.save(function(err) {
            if (err) { return next(err); }
            res.prompt('consent');
          });
        }

        dispatcher.use('consent', { spawn: [
          function(req, res, next) {
            res.redirect('/from/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start',
              x: 1
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
      });
    }); // after saving state

    describe('carrying state due to modified state', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.prompt('federate');
        }

        dispatcher.use('federate', { spawn: [
          function(req, res, next) {
            req.state.verifier = 'secret';
            res.redirect('/from/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
        expect(dispatcher._store.save).to.have.callCount(2);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });

      it('should set state', function() {
        //expect(request.state.initiatedAt).to.be.a('number')
        //delete request.state.initiatedAt;

        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'federate',
          verifier: 'secret',
          parent: 'H1'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;
        //expect(request.session.state['H2'].initiatedAt).to.be.a('number')
        //delete request.session.state['H2'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            },
            'H2': {
              name: 'federate',
              verifier: 'secret',
              parent: 'H1'
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/federate?state=H2');
      });
    }); // carrying state due to modified state

    describe('carrying state due to touched state', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.prompt('finish');
        }

        dispatcher.use('finish', { spawn: [
          function(req, res, next) {
            req.state.touch();
            res.redirect('/from/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
        expect(dispatcher._store.save).to.have.callCount(2);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });

      it('should set state', function() {
        //expect(request.state.initiatedAt).to.be.a('number')
        //delete request.state.initiatedAt;

        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'finish',
          parent: 'H1'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;
        //expect(request.session.state['H2'].initiatedAt).to.be.a('number')
        //delete request.session.state['H2'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            },
            'H2': {
              name: 'finish',
              parent: 'H1'
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/finish?state=H2');
      });
    }); // carrying state due to touched state

  }); // prompting via redirect

  describe('prompting via render', function() {

    describe('without options', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, layout, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.prompt('consent');
        }

        dispatcher.use('consent', { spawn: [
          function(req, res, next) {
            res.render('views/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            res.locals = {};
          })
          .render(function(res, lay) {
            layout = lay;
            res.end();
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should set locals', function() {
        expect(request.locals).to.deep.equal({});
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should render layout', function() {
        expect(layout).to.equal('views/consent');
        expect(response.locals).to.deep.equal({
          state: 'H1'
        });
      });
    }); // without options

    describe('with options', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, layout, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.prompt('consent', { scope: 'test' });
        }

        dispatcher.use('consent', { spawn: [
          function(req, res, next) {
            res.locals.scope = req.locals.scope;
            res.render('views/' + req.state.name);
          }
        ]});


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            res.locals = {};
          })
          .render(function(res, lay) {
            layout = lay;
            res.end();
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should set locals', function() {
        expect(request.locals).to.deep.equal({
          scope: 'test'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should render layout', function() {
        expect(layout).to.equal('views/consent');
        expect(response.locals).to.deep.equal({
          scope: 'test',
          state: 'H1'
        });
      });
    }); // with options

  }); // prompting via render

  describe('redirecting', function() {

    describe('within flow', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.redirect('/from/' + req.state.name);
        }


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
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
          name: 'start'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/start?state=H1');
      });
    }); // within flow

  }); // redirecting


  describe('rendering', function() {

    describe('within flow', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, layout, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          res.render('views/' + req.state.name);
        }


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            res.locals = {};
          })
          .render(function(res, lay) {
            layout = lay;
            res.end();
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
          name: 'start'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should render layout', function() {
        expect(layout).to.equal('views/start');
        expect(response.locals).to.deep.equal({
          state: 'H1'
        });
      });
    }); // within flow

    describe('from finish', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, layout, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        dispatcher.use('start', { exit: [
          function(req, res, next) {
            res.render('views/finish/' + req.state.name);
          }
        ]});

        function handler(req, res, next) {
          next();
        }


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            res.locals = {};
          })
          .render(function(res, lay) {
            layout = lay;
            res.end();
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
        expect(dispatcher._store.save).to.have.callCount(0);
        expect(dispatcher._store.update).to.have.callCount(0);
        expect(dispatcher._store.destroy).to.have.callCount(0);
      });

      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'start'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should not persist state in session', function() {
        expect(request.session).to.deep.equal({});
      });

      it('should render layout', function() {
        expect(layout).to.equal('views/finish/start');
        expect(response.locals).to.deep.equal({});
      });
    }); // from finish

    describe('from finish after saving state within flow', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, layout, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        dispatcher.use('start', { exit: [
          function(req, res, next) {
            res.render('views/finish/' + req.state.name);
          }
        ]});

        function handler(req, res, next) {
          req.state.save(function(err) {
            if (err) { return next(err); }
            res.locals.state = req.state.handle;
            next();
          });
        }


        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            res.locals = {};
          })
          .render(function(res, lay) {
            layout = lay;
            res.end();
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
        expect(dispatcher._store.destroy).to.have.callCount(1);
        var call = dispatcher._store.destroy.getCall(0);
        expect(call.args[1]).to.equal('H1');
      });

      it('should set state', function() {
        expect(request.state).to.be.an('object');
        expect(request.state).to.deep.equal({
          name: 'start'
        });
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should remove saved state from session', function() {
        expect(request.session).to.deep.equal({});
      });

      it('should render layout', function() {
        expect(layout).to.equal('views/finish/start');
        expect(response.locals).to.deep.equal({
          state: 'H1'
        });
      });
    }); // from finish after state saving state within flow

  }); // rendering


  describe('failure', function() {

    // FIXME: Get the dispatcher to next here
    describe.skip('due to state not being registered', function() {
      var hc = 1;
      var dispatcher = new Dispatcher({ genh: function() { return 'H' + hc++; } })
        , request, response, err;

      before(function() {
        sinon.spy(dispatcher._store, 'load');
        sinon.spy(dispatcher._store, 'save');
        sinon.spy(dispatcher._store, 'update');
        sinon.spy(dispatcher._store, 'destroy');
      });

      before(function(done) {
        function handler(req, res, next) {
          console.log('XYZ?');
          res.prompt('consent');
        }

        /*
        dispatcher.use('consent', [
          function(req, res, next) {
            res.redirect('/from/' + req.state.name);
          }
        ], null);
        */

        chai.express.handler(dispatcher.flow('start', handler, { external: true }))
          .req(function(req) {
            request = req;
            request.query = { state: 'X1' };
            request.session = {};
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            console.log('ERROR');
            err = e;
            //done();
          })
          .dispatch();
      });

      after(function() {
        dispatcher._store.destroy.restore();
        dispatcher._store.update.restore();
        dispatcher._store.save.restore();
        dispatcher._store.load.restore();
      });


      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('Error');
        expect(err.message).to.equal("Cannot find flow 'login'");
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
          name: 'consent',
          parent: 'H1'
        });
      });

      it('should set locals', function() {
        expect(request.locals).to.deep.equal({});
      });

      it('should not set yieldState', function() {
        expect(request.yieldState).to.be.undefined;
      });

      it('should persist state in session', function() {
        //expect(request.session.state['H1'].initiatedAt).to.be.a('number')
        //delete request.session.state['H1'].initiatedAt;

        expect(request.session).to.deep.equal({
          state: {
            'H1': {
              name: 'start'
            }
          }
        });
      });

      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('/from/consent?state=H1');
      });
    }); // due to state not being registered

  });

});
