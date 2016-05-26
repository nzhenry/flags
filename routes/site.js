var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');

router.get('/logout', function(req, res) {
  res.clearCookie('Authorization');
  res.redirect('/');
});

/* GET home page. */
router.get('/*', function(req, res, next) {
  res.render('index');
});

module.exports = router;
