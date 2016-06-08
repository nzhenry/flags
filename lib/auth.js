let passport = require('passport');
let pjwt = require('passport-jwt');
let passportLocal = require('passport-local');
let http = require('request-promise');
let config = require('./config');
let emailer = require('./emailer');
let ApiError = require('./errors/ApiError');
let errorCodes = require('./errors/errorCodes');
let errorUtils = require('./errors/errorUtils');
let jwt = require('./jwt/jwt-promise');
let users = require('./model/users');

module.exports = exports = {
  init: function() {
    passport.use(new passportLocal.Strategy({
      usernameField: 'email',
      passwordField: 'password'
    }, authenticate));
    
    let extractMethod =
      req => req.get('Authorization')
        || req.cookies.Authorization;
    
    let opts = {
      jwtFromRequest: extractMethod,
      secretOrKey: config.jwtSecret,
      algorithms: ['HS256'],
      ignoreExpiration: true
    }

    let onJwtAuthenticateSuccess =
      (jwt_payload, done) =>
        users.one(parseInt(jwt_payload.sub))
          .then(user => done(null, user));
    
    passport.use(new pjwt.Strategy(opts, onJwtAuthenticateSuccess));
    
    return passport.initialize();
  },
  
  validateCredentials: passport.authenticate('local', {session: false}),
  
  validateToken: function(req, res, next) {
    return passport.authenticate('jwt', {session: false}, function(err,user) {
      req.user = user;
      res.locals.user = user;
      return next();
    })(req, res, next);
  },
  
  respondWithSessionToken: function(req, res, next) {
    let user = req.user;
    let options = { subject: user.id.toString() };
    let token = jwt.sign({}, config.jwtSecret, options);
    res.cookie('Authorization', token);
    res.json({
      user: {
        id: user.id,
        email: user.email
      },
      jwt: token
    });
  },
  
  verifyCaptcha: function(req, res, next) {
    return http.post({
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
  },
  
  signup: function(req, res, next) {
    return users.create(req.body.email,req.body.password)
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
  },
  
  sendResetPasswordLink: function(req, res, next) {
    return users.one(req.body.email)
      .then(user => {
        if(user) {
          return emailer.sendResetPasswordLink(user);
        } else {
          throw 'not found';
        }
      })
      .then(() => res.send('An email has been sent with instructions on how to reset your password'))
      .catch(err => {
        if(err == 'not found') {
          res.json(errorUtils.jsonError(errorCodes.accountNotFound,
            'No account found with that email address'));
        } else {
          next(err);
        }})
  },
  
  verifyPwdResetToken: function(req,res,next) {
    let token = req.method == 'GET' ? req.params.token : req.body.token;
    let jwtPayload;
    return jwt.verify(token, config.jwtSecret)
      .then(pl => {
        jwtPayload = pl
        return pl.sub;
      })
      .then(parseInt)
      .then(users.one)
      .then(user => {
        if(!user) {
          throw new ApiError(errorCodes.accountNotFound, 'user not found');
        } else if(user.pwd_reset_key == jwtPayload.prk) {
          req.user = user;
          next();
        } else if(user.pwd_reset_key) {
          throw new ApiError(errorCodes.keyMismatch, 'key mismatch');
        } else {
          throw new ApiError(errorCodes.usedToken, 'token already used');
        }
      })
      .catch(err => {
        let response = getInvalidPwdResetTokenResponse(err);
        res.json(response);
      })
      .catch(next);
  },
  
  setNewUserPassword: function(req, res, next) {
    return req.user.newPassword(req.body.password)
      .then(() => next())
      .catch(next);
  }
}

function authenticate(email, password, done) {
  return users.one(email).then(user => {
    if(user) {
      if(user.validPassword(password)) {
        console.log('successfully authenticated');
        return done(null, user);
      } else {
        console.log('password mismatch');
      }
    } else {
      console.log("no user found for '" + email + "'");
    }
    return done(null, false);
  });
}

function getInvalidPwdResetTokenResponse(error) {
  switch(error.name) {
    case 'TokenExpiredError': return errorUtils.jsonError(
      errorCodes.expiredToken, 'expired token');
    case 'JsonWebTokenError': return errorUtils.jsonError(
      errorCodes.malformedToken, 'malformed token');
    case 'ApiError': return errorUtils.jsonError(
      error.code, error.message);
    default: throw error;
  }
}
