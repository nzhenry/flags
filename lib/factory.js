
let pjwt = require('passport-jwt');
let passportLocal = require('passport-local');

exports.knex = function(args) {
  return require('knex')(args)
}

exports.passportLocalStrategy = function(opts, callback) {
  return new passportLocal.Strategy(opts, callback);
}

exports.passportJwtStrategy = function(opts, callback) {
  return new pjwt.Strategy(opts, callback);
}
