var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/', function(req, res, next) {
  res.render('login', { error: req.flash('error') });
});

router.post('/', passport.authenticate('local'));

router.post('/', (req, res) => {
  res.json(req.user);
});

module.exports = router;
