var uri = require('url');

exports = module.exports = function(url, req) {
  var u = uri.parse(url);
  // TODO: Need to respect proxy settings here
  var host = req.headers['host'];
  if (u.host == host) { return true; }
  return false;
};
