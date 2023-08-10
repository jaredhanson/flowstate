var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , State = require('../lib/state');


describe('State', function() {
  
  it('should construct with data', function() {
    var req = new Object();
    var state = new State(req, { cow: 'moo' });
    expect(state._req).to.equal(req);
    expect(state.handle).to.be.undefined;
    expect(JSON.stringify(state)).to.equal('{"cow":"moo"}');
  });
  
  it('should construct with data and handle', function() {
    var req = new Object();
    var state = new State(req, { cow: 'moo' }, 'xyz');
    expect(state._req).to.equal(req);
    expect(state.handle).to.equal('xyz');
    expect(JSON.stringify(state)).to.equal('{"cow":"moo"}');
  });
  
  it('should construct with handle in data', function() {
    var req = new Object();
    var state = new State(req, { handle: 'xyz', cow: 'moo' });
    expect(state._req).to.equal(req);
    expect(state.handle).to.equal('xyz');
    expect(JSON.stringify(state)).to.equal('{"cow":"moo"}');
  });
  
});
