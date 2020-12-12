var Manager = require('./manager');


exports = module.exports = new Manager();

exports.state = require('./middleware/state');

exports.Manager = Manager;
exports.SessionStore = require('./stores/session');

exports.middleware = {};
exports.middleware.clean = require('./middleware/clean');

exports.ExpiredStateError = require('./errors/expiredstateerror');
exports.MissingStateError = require('./errors/missingstateerror');
