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
  user.validPassword = pwd => hash(pwd) == user.token;
  user.createPasswordResetKey = key => db.users().update({pwd_reset_key:key}).where({id:user.id});
  user.newPassword = pwd => db.users().update({token:hash(pwd),pwd_reset_key:null}).where({id:user.id});
  return user;
}

function hash(x) {
  return crypto
    .createHash("md5")
    .update(x)
    .digest('hex');
}
