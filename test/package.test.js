/* global describe, it */

var expect = require('chai').expect;
var sinon = require('sinon');
var flowstate = require('..');


describe('flowstate', function() {
  
  it('should export constructors', function() {
    expect(flowstate.SessionStore).to.be.a('function');
  });
  
  it('should export Error constructors', function() {
    expect(flowstate.ExpiredStateError).to.be.a('function');
    expect(flowstate.MissingStateError).to.be.a('function');
  });
  
});

afterEach(function() {
  sinon.restore();
});
