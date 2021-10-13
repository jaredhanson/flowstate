var State = require('./state')
  , SessionStore = require('./stores/session')
  , MissingStateError = require('./errors/missingstateerror')
  , dispatch = require('./utils').dispatch
  , dispatchReal = dispatch
  , flatten = require('utils-flatten')
  , uri = require('url')
  , debug = require('debug')('flowstate');


function Manager(options, store) {
  if (!store) { store = new SessionStore(options); }
  
  this._store = store;
}

/*
Manager.prototype._through = function(through, err, req, res, next) {
  req.yieldState = req.state;
  req.state = new State(req, { name: through }, undefined, false, true);
  return this._dispatch(null, err, req, res, next);
}
*/


module.exports = Manager;
