/* global describe, it */

var flowstate = require('..');
var expect = require('chai').expect;


describe('flowstate', function() {
  
  it('should export constructors', function() {
    expect(flowstate.Dispatcher).to.be.a('function');
    expect(flowstate.SessionStore).to.be.a('function');
  });
  
  it('should export Error constructors', function() {
    expect(flowstate.ExpiredStateError).to.be.a('function');
    expect(flowstate.MissingStateError).to.be.a('function');
  });
  
});
