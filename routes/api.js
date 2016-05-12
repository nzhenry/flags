var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var http = require('request-promise');
var auth = require('../lib/auth');
var config = require('../lib/config');
var User = require('../lib/model/user');
var emailer = require('../lib/emailer');

router.post('/login',
  auth.validateCredentials,
  (req,res) => login(req.user,res));

router.post('/signup', (req, res, next) =>
  http({
      method: 'POST',
      uri: 'https://www.google.com/recaptcha/api/siteverify',
      form: {
        secret: config.recaptchaSecret,
        response: req.body.captcha
      }
    })
    .then(body => JSON.parse(body))
    .then(data => {
      if(!data.success) {
        throw {captchaFail: true};
      }
    })
    .then(() => User.create(req.body.email,req.body.password))
    .then(user => login(user,res))
    .catch(err => {
        if(err.code == 23505) { // 23505 = PSQL unique constraint violation
          res.json({error: {code: 1, message:
            'An account with that email address already exists'}})
        } else if(err.captchaFail) {
          res.json({error: {code: 2, message:
            'Could not verify captcha'}})
        } else {
          console.log(`err: ${err}`);
          next(err);
        }}));

router.post('/sendResetPasswordLink', (req, res, next) =>
  http({
      method: 'POST',
      uri: 'https://www.google.com/recaptcha/api/siteverify',
      form: {
        secret: config.recaptchaSecret,
        response: req.body.captcha
      }
    })
    .then(body => JSON.parse(body))
    .then(data => {
      if(!data.success) {
        throw {captchaFail: true};
      }
    })
    .then(() => attemptSendPwdResetLink(req.body.email))
    .then(() => res.send('An email has been sent with instructions on how to reset your password'))
    .catch(err => {
        if(err == 'not found') {
          res.send({error: {code: 2, message: 'No account found with that email address'}});
        } else {
          next(err);
        }}));

router.put('/resetPassword',
  (req, res, next) =>
    auth.verifyPwdResetToken(req.body.jwt)
      .then(payload => parseInt(payload.sub))
      .then(User)
      .then(user => {
        user.newPassword(req.body.password);
        login(user, res);
      })
      .catch(next));

router.get('/verifyPasswordResetToken/:token', function(req, res, next) {
  auth.verifyPwdResetToken(req.params.token)
    .then(() => { return {result: 'ok'}})
    .catch(err => {
      switch(err.name) {
        case 'TokenExpiredError': return {result: 'fail', reason: 'expired token'};
        case 'PasswordResetKeyMismatchError': return {result: 'fail', reason: 'key mismatch'};
        case 'JsonWebTokenError': return {result: 'fail', reason: 'malformed token'};
        default: throw err;
      }
    })
    .then(x => res.json(x))
    .catch(next);
});

function attemptSendPwdResetLink(email) {
  return User(email)
    .then(user => {
        if(user) {
          return emailer.sendResetPasswordLink(user);
        } else {
          throw 'not found';
        }
      });
}

function login(user,res) {
  var options = {subject: user.id.toString()};
  var token = jwt.sign({}, config.jwtSecret, options);
  res.cookie('Authorization', token);
  res.json({user:{id:user.id,email:user.email},jwt:token});
}

module.exports = router;
