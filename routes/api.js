var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');
var users = require('../lib/model/users');
var flags = require('../lib/model/flags');

router.post('/login',
  auth.validateCredentials,
  (req,res) => auth.respondWithSessionToken(req.user,res));

router.post('/signup',
  auth.verifyCaptcha,
  auth.signup);

router.post('/sendResetPasswordLink',
  auth.verifyCaptcha,
  auth.sendResetPasswordLink);

router.put('/resetPassword',
  (req, res, next) =>
    auth.verifyPwdResetToken(req.body.jwt)
      .then(payload => parseInt(payload.sub))
      .then(users.one)
      .then(user => {
        user.newPassword(req.body.password);
        auth.respondWithSessionToken(user, res);
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

router.get('/flags/:id', function(req, res, next) {
  flags.one(req.params.id).then(
    x => { res.json(x) },
    e => { next(e) }
  );
});

router.get('/flags', function(req, res, next) {
  flags.many(req.query).then(
    x => { res.json(x) },
    e => { next(e) }
  );
});

module.exports = router;
