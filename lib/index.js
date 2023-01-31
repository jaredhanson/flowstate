/**
 * flowstate is....
 *
 * @module flowstate
 */

/*
 * State middleware
 *
 * @type {function}
 */
exports = module.exports = require('./middleware/state');
exports.clean = require('./middleware/clean');

exports.SessionStore = require('./store/session');
