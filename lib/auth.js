var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var users = require('./model/users');
var config = require('./config');
var emailer = require('./emailer');
var http = require('request-promise');
var errorCodes = require('./errors/errorCodes');
var errorUtils = require('./errors/errorUtils');
var PasswordResetKeyMismatchError = require('./errors/PasswordResetKeyMismatchError');
var jwt = require('jsonwebtoken');
var pjwt = require('passport-jwt');
var JwtStrategy = pjwt.Strategy;
var ExtractJwt = pjwt.ExtractJwt;

exports.init = init;
exports.validateCredentials = passport.authenticate('local', {session: false});
exports.validateToken = validateToken;
exports.respondWithSessionToken = respondWithSessionToken;
exports.verifyCaptcha = verifyCaptcha;
exports.signup = signup;
exports.sendResetPasswordLink = sendResetPasswordLink;
exports.verifyPwdResetToken = verifyPwdResetToken;
exports.setNewUserPassword = setNewUserPassword;

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

function validateToken(req, res, next) {
  return passport.authenticate('jwt', {session: false}, function(err,user,info) {
    req.user = user;
    res.locals.user = user;
    res.locals.recaptchaKey = config.recaptchaKey;
    return next();
  })(req, res, next);
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

function respondWithSessionToken(req,res,next) {
  let user = req.user;
  var options = {subject: user.id.toString()};
  var token = jwt.sign({}, config.jwtSecret, options);
  res.cookie('Authorization', token);
  res.json({user:{id:user.id,email:user.email},jwt:token});
}

function verifyCaptcha(req, res, next) {
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
      if(data.success) {
        next();
      } else {
        res.json(errorUtils.jsonError(errorCodes.captcha,
          'Could not verify captcha'));
      }
    }).catch(next);
}

function signup(req, res, next) {
  users.create(req.body.email,req.body.password)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      if(err.code == 23505) { // 23505 = PSQL unique constraint violation
        res.json(errorUtils.jsonError(errorCodes.emailClash,
          'An account with that email address already exists'));
      } else {
        next(err);
      }
    })
}

function sendResetPasswordLink(req, res, next) {
  attemptSendPwdResetLink(req.body.email)
    .then(() => res.send('An email has been sent with instructions on how to reset your password'))
    .catch(err => {
        if(err == 'not found') {
          res.send(errorUtils.jsonError(errorCodes.accountNotFound,
            'No account found with that email address'));
        } else {
          next(err);
        }})
}

function attemptSendPwdResetLink(email) {
  return users.one(email)
    .then(user => {
        if(user) {
          return emailer.sendResetPasswordLink(user);
        } else {
          throw 'not found';
        }
      });
}

function getInvalidPwdResetTokenResponse(error) {
  switch(error.name) {
    case 'TokenExpiredError': return errorUtils.jsonError(
      errorCodes.expiredToken, 'expired token');
    case 'PasswordResetKeyMismatchError': return errorUtils.jsonError(
      errorCodes.keyMismatch, 'key mismatch');
    case 'JsonWebTokenError': return errorUtils.jsonError(
      errorCodes.malformedToken, 'malformed token');
    default: throw error;
  }
}

function verifyPwdResetToken(req,res,next) {
  let token = req.method == 'GET' ? req.params.token : req.body.token;
  let jwtPayload;
  verifyJWT(token, config.jwtSecret)
    .then(pl => {
      jwtPayload = pl
      return pl.sub;
    })
    .then(parseInt)
    .then(users.one)
    .then(user => {
      if(user.pwd_reset_key == jwtPayload.prk) {
        req.user = user;
        next();
      } else {
        throw new PasswordResetKeyMismatchError();
    }})
    .catch(err => {
      res.json(getInvalidPwdResetTokenResponse(err));
    });
}

function setNewUserPassword(req, res, next) {
  return req.user.newPassword(req.body.password)
    .then(() => next())
    .catch(next);
}
