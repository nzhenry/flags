var express = require('express');
var router = express.Router();
var auth = require('../lib/auth');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/logout', function(req, res) {
  res.clearCookie('Authorization');
  res.redirect('/');
});

module.exports = router;
