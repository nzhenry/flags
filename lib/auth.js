var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./model/user');

module.exports = exports = function() {
	passport.use(new LocalStrategy(
		function(username, password, done) {
			User(username).then(user => {
				if (!user) {
					done(null, false, { message: 'Incorrect username.' });
				}
				if (!user.validPassword(password)) {
					done(null, false, { message: 'Incorrect password.' });
				}
				done(null, user);
			});
		}
	));
	
	passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User(id).then(user => done(null, user));
  });
};
