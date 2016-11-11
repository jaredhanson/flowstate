var chai = require('chai')
  , expect = require('chai').expect
  , sinon = require('sinon')
  , resumeStateError = require('../../lib/middleware/resumeError');


describe('middleware/resumeError', function() {
  
  it('should be named resumeStateError', function() {
    var dispatcher = new Object();
    var store = new Object();
    expect(resumeStateError(dispatcher, store).name).to.equal('resumeStateError');
  });
  
});
