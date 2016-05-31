'use strict'

var db = require('../db');
var crypto = require('crypto');
var users = () => db('users');

module.exports = exports = {
  one: x => users()
  .where(typeof x == 'string' ? 'email' : 'id', x)
  .then(first)
  .then(addMethods)
}

exports.create = (email,pwd) => users()
  .insert({email: email,
    authtype: 'local',
    token: hash(pwd)})
  .returning('*')
  .then(first)
  .then(addMethods);

exports.update = user => users()
  .update(user)
  .where({id: user.id});

function first(x) {
  return x[0];
}

function addMethods(user) {
  if(!user) return;
  user.validPassword = pwd => hash(pwd) == user.token;
  user.createPasswordResetKey = key => users().update({pwd_reset_key:key}).where({id:user.id});
  user.newPassword = pwd => users().update({token:hash(pwd),pwd_reset_key:null}).where({id:user.id});
  return user;
}

function hash(x) {
  return crypto
    .createHash("md5")
    .update(x)
    .digest('hex');
}
