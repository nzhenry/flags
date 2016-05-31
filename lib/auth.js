var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var users = require('./model/users');
var config = require('./config');
var PasswordResetKeyMismatchError = require('./errors/PasswordResetKeyMismatchError');
var jwt = require('jsonwebtoken');
var pjwt = require('passport-jwt');
var JwtStrategy = pjwt.Strategy;
var ExtractJwt = pjwt.ExtractJwt;

exports.init = init;
exports.validateCredentials = passport.authenticate('local', {session: false});
exports.validateToken = validateToken;
exports.verifyPwdResetToken = verifyPwdResetToken;
exports.respondWithSessionToken = respondWithSessionToken;

function init() {
	passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, function(email, password, done) {
			users.one(email).then(user => {
				if (user && user.validPassword(password)) {
  				done(null, user);
				} else {
					done(null, false);
  			}
			});
		}
	));
	
	var extractMethod = req => req.get('Authorization') || req.cookies.Authorization;
	
  var opts = {
    jwtFromRequest: extractMethod,
    secretOrKey: config.jwtSecret,
    algorithms: ['HS256'],
    ignoreExpiration: true
  }
  
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    users.one(parseInt(jwt_payload.sub)).then(user => done(null, user));
  }));
  
  return passport.initialize();
};

function validateToken() {
  return function(req, res, next) {
    return passport.authenticate('jwt', {session: false}, function(err,user,info){
      req.user = user;
      res.locals.user = user;
      res.locals.recaptchaKey = config.recaptchaKey;
      return next();
    })(req, res, next);
  }
}

function verifyJWT(token, secret) {
  return new Promise((f,r) => jwt.verify(token, secret, (err,payload) => {
    if(err) {
      r(err);
    } else {
      f(payload);
    }
  }));
}

function verifyPwdResetToken(token) {
  return verifyJWT(token, config.jwtSecret)
    .then(pl => users.one(parseInt(pl.sub))
      .then(user => {
        if(user.pwd_reset_key == pl.prk) {
          return pl;
        } else {
          throw new PasswordResetKeyMismatchError();
        }
      }));
}

function respondWithSessionToken(user,res) {
  var options = {subject: user.id.toString()};
  var token = jwt.sign({}, config.jwtSecret, options);
  res.cookie('Authorization', token);
  res.json({user:{id:user.id,email:user.email},jwt:token});
}