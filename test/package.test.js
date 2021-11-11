/* global describe, it */

var expect = require('chai').expect;
var sinon = require('sinon');
var flowstate = require('..');


describe('flowstate', function() {
  
  it('should export middleware', function() {
    expect(flowstate).to.be.a('function');
    expect(flowstate.clean).to.be.a('function');
  });
  
  it('should export stores', function() {
    expect(flowstate.SessionStore).to.be.a('function');
  });
  
});

afterEach(function() {
  sinon.restore();
});
