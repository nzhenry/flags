'use strict'

var db = require('../db');
var crypto = require('crypto');

exports.one = x => db.users()
  .where(typeof x == 'string' ? 'email' : 'id', x)
  .then(first)
  .then(addMethods);

exports.create = (email,pwd) => db.users()
  .insert({email: email,
    authtype: 'local',
    token: hash(pwd)})
  .returning('*')
  .then(first)
  .then(addMethods);

exports.update = user => db.users()
  .update(user)
  .where({id: user.id});

function first(x) {
  return x[0];
}

function addMethods(user) {
  if(!user) return;
  user.validPassword = validPassword;
  user.createPasswordResetKey = createPasswordResetKey; 
  user.newPassword = newPassword;
  return user;
}

function hash(x) {
  return crypto
    .createHash("md5")
    .update(x)
    .digest('hex');
}

function validPassword(pwd) {
  return hash(pwd) == this.token;
}

function createPasswordResetKey(key) {
  return db.users()
    .update({pwd_reset_key: key})
    .where({id: this.id});
}

function newPassword(pwd) {
  return db.users()
    .update({
      token: hash(pwd),
      pwd_reset_key: null})
    .where({id: this.id});
}
