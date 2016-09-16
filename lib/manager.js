var flatten = require('utils-flatten');
var dispatch = require('./utils').dispatch;


function Manager() {
  this._flows = {};
}

Manager.prototype.add = function(name, begin, resume) {
  begin = begin && flatten(Array.prototype.slice.call(begin, 0));
  resume = resume && flatten(Array.prototype.slice.call(resume, 0));
  
  this._flows[name] = {
    begin: begin,
    resume: resume
  };
}

Manager.prototype.goto = function(name, req, res, next) {
  var flow = this._flows[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  if (!flow.begin) { throw new Error("Cannot begin flow '" + name + "'"); }
  
  dispatch(flow.begin)(null, req, res, next);
}

Manager.prototype.continue = function(name, req, res, next) {
  var flow = this._flows[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  if (!flow.resume) { throw new Error("Cannot continue flow '" + name + "'"); }
  
  dispatch(flow.resume)(null, req, res, next);
}

Manager.prototype._resume = function(name, err, req, res, next) {
  var flow = this._flows[name];
  if (!flow) { throw new Error("Cannot find flow '" + name + "'"); }
  if (!flow.resume) { throw new Error("Cannot resume flow '" + name + "'"); }
  
  dispatch(flow.resume)(err, req, res, next);
}


module.exports = Manager;
