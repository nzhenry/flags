var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');
var data = require('../lib/data');

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

router.get('/flags/:id', data.flag);

router.get('/flags', data.flags);

module.exports = router;
