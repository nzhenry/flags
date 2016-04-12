'use strict'

var db = require('../db');
var crypto = require('crypto');

module.exports = exports = x => db('users')
  .where(typeof x == 'string' ? 'email' : 'id', x)
  .then(first)
  .then(addMethods);

exports.create = (email,authtype,pwd) => db('users')
  .insert({email: email,
    authtype: authtype,
    token: hash(pwd)})
  .returning('*')
  .then(first)
  .then(addMethods);

exports.update = user => db('users')
  .update(user)
  .where({id: user.id})
  .then(console.log);

function first(x) {
  return x[0];
}

function addMethods(user) {
  if(user) {
    user.validPassword = pwd => hash(pwd) == user.token;
  }
  return user;
}

function hash(x) {
  return crypto
    .createHash("md5")
    .update(x)
    .digest('hex');
}
