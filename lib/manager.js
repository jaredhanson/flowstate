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


module.exports = Manager;
