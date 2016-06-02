let chai = require('chai');
let assert = chai.assert;
let mockery = require('mockery');
let sinon = require('sinon');

before(function() {
	// hijack require(...)
	mockery.enable({
		warnOnUnregistered: false,
		warnOnReplace: false,
		useCleanCache: true
	})
})

afterEach(function() {
	// return require(...) to normal
	mockery.disable();
})

describe('auth service', function() {
	let auth,
		passport = {},
		passportLocal = {},
		jwt = {},
		users = {},
		config = { jwtSecret: 'jwtSecret' };
	
	before(function() {
		mockery.registerMock('./model/users', users);
		mockery.registerMock('passport', passport);
		mockery.registerMock('passport-local', passportLocal);
		mockery.registerMock('jsonwebtoken', jwt);
		mockery.registerMock('./config', config);
	})
  
  describe('require', function() {
		beforeEach(function() {
			passport.authenticate = sinon.stub().returns('authenticate');
			auth = require('../../../lib/auth');
		});
		
    it('should create middleware for the local auth strategy', function() {
			assert(passport.authenticate.calledOnce);
      assert(passport.authenticate.calledWith(
				'local', {session: false}));
    })
		
    it('should expose middleware for the local auth strategy', function() {
			assert(auth.validateCredentials == 'authenticate');
    })
  })
	
	describe('init', function() {
		before(function() {
			passportLocal.Strategy = sinon.spy()
		})
		
		beforeEach(function(){
			passport.initialize = sinon.spy();
			passport.use = sinon.spy();
			auth.init();
		})
		
    it('should create a local authentication strategy', function() {
			assert(passportLocal.Strategy.calledOnce);
      assert(passportLocal.Strategy.calledWith(
				{
					usernameField: 'email',
					passwordField: 'password'
				},
				sinon.match.func));
    })
		
    it('should configure the app to use the local authentication strategy', function() {
      assert(passport.use.calledWith(new passportLocal.Strategy()));
    })
	})
		
	describe('authenticate', function() {
		let email = 'email',
			password = 'password',
			done,
			authenticate;
		
		before(function(){
			auth.init();
			users.one = sinon.stub().returns(Promise.resolve(null));
			authenticate = passportLocal.Strategy.getCall(0).args[1];
		})
		
		beforeEach(function(){
			done = sinon.spy();
			return authenticate(email, password, done);
		})
		
		it('should get the user', function() {
			assert(users.one.calledOnce);
			assert(users.one.calledWith(email));
		})
		
		describe('if no user is found', function(){
			it('fshould fail to authenticate', function() {
				assert(done.calledOnce);
				assert(done.calledWith(null,false));
			})
		})
		
		describe('if a user is found', function(){
			let user = {};
			
			before(function() {
				user.validPassword = sinon.stub().returns(false);
				users.one = sinon.stub().returns(Promise.resolve(user));
			});
			
			describe('but the password is not valid', function(){
				it('should fail to authenticate', function() {
					assert(done.calledOnce);
					assert(done.calledWith(null,false));
				})
			})
			
			describe('and the password is valid', function(){
				before(function() {
					user.validPassword.returns(true);
				});
			
				it('should authenticate successfully', function() {
					assert(done.calledOnce);
					assert(done.calledWith(null, sinon.match.truthy));
				})
			})
		})
	})
	
	describe('validateToken', function() {
		let req, res, next, jwtMiddleware;
		before(function() {
			req = {};
			res = {locals:{}};
		})
		beforeEach(function() {
			jwtMiddleware = sinon.spy();
			passport.authenticate = sinon.stub().returns(jwtMiddleware);
			next = sinon.spy();
			auth.validateToken(req,res,next);
		})
		
    it('should create middleware for the jwt auth strategy', function() {
			assert(passport.authenticate.calledOnce);
      assert(passport.authenticate.calledWith(
				'jwt', {session: false}, sinon.match.func));
    })
		
    it('should execute the middleware for the local auth strategy', function() {
			assert(jwtMiddleware.calledOnce);
			assert(jwtMiddleware.calledWith(req,res,next));
    })
		
		describe('when the token is successfully validated', function() {
			let successCallback, user = 'user';
			beforeEach(function() {
				successCallback = passport.authenticate.getCall(0).args[2];
				successCallback(null,user);
			});
			it('should add the user to the request', function() {
				assert(req.user == user);
			})
			it('should add the user to the response', function() {
				assert(res.locals.user == user);
			})
			it("should invoke the 'next' callback", function() {
				assert(next.calledOnce);
			})
		})
	})
	
	describe('respondWithSessionToken', function() {
		let req, res, user, options, token;
		before(function() {
			user = { id: 1 };
			req = { user: user };
			res = {};
			options = { subject: user.id.toString() };
			token = 'token';
		})
		
		beforeEach(function() {
			res.cookie = sinon.spy();
			res.json = sinon.spy();
			jwt.sign = sinon.stub().returns(token);
			auth.respondWithSessionToken(req,res);
		})
		
    it('should create a jwt token', function() {
			assert(jwt.sign.calledOnce);
      assert(jwt.sign.calledWith(
				{}, config.jwtSecret, options));
    })
		
    it('should add an auth cookie to the response headers', function() {
			assert(res.cookie.calledOnce);
      assert(res.cookie.calledWith(
				'Authorization', token));
    })
		
    it('should create the response body', function() {
			assert(res.json.calledOnce);
			assert(res.json.calledWith({
				user:{
					id: user.id,
					email: user.email
				},
				jwt: token
			}));
    })
	})
})
