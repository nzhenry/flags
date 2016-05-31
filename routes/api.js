var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');
var users = require('../lib/model/users');
var flags = require('../lib/model/flags');

router.post('/login',
  auth.validateCredentials,
  auth.respondWithSessionToken);

router.post('/signup',
  auth.verifyCaptcha,
  auth.signup,
  auth.respondWithSessionToken);

router.post('/sendResetPasswordLink',
  auth.verifyCaptcha,
  auth.sendResetPasswordLink);

router.get('/verifyPasswordResetToken/:token',
  auth.verifyPwdResetToken,
  auth.respondWithSessionToken);

router.post('/resetPassword',
  auth.verifyPwdResetToken,
  auth.setNewUserPassword,
  auth.respondWithSessionToken);

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
