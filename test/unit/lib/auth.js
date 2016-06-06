let chai = require('chai');
let assert = chai.assert;
let sinon = require('sinon');

describe('auth service', function() {
	let jwt,
			passport,
			pjwt,
			passportLocal,
			http,
			config,
			emailer,
			errorUtils,
			users;
	
	function local(lib) {
		return '../../../lib/' + lib;
	}
	
	function resetRequire(lib) {
		delete require.cache[require.resolve(lib)]
	}
	
	beforeEach(function() {
		// do this first to prevent a db connection from opening
		config = require(local('config'));
		config.db = null;
		
		jwt = require('jsonwebtoken');
		passport = require('passport');
		pjwt = require('passport-jwt');
		passportLocal = require('passport-local');
		http = require('request-promise');
		// config = require(local('config'));
		emailer = require(local('emailer'));
		errorUtils = require(local('errors/errorUtils'));
		users = require(local('model/users'));
	})
	
	afterEach(function(){
		resetRequire('jsonwebtoken');
		resetRequire('passport');
		resetRequire('passport-jwt');
		resetRequire('passport-local');
		resetRequire('request-promise');
		resetRequire(local('config'));
		resetRequire(local('emailer'));
		resetRequire(local('errors/errorUtils'));
		resetRequire(local('model/users'));
		
		resetRequire(local('auth'));
	})
	
  describe('require', function() {
		let auth, spy, run, req, res, next;
		
		beforeEach(function() {
			req = {id: 'req'};
			res = {id: 'res'};
			next = sinon.spy();
			run = () => { return auth = require(local('auth')) }
			passport.authenticate = sinon.stub().returns('authenticate');
		})
		
    it('should create middleware for the local auth strategy', function() {
			run();
			assert(passport.authenticate.called);
			assert(passport.authenticate.calledOnce);
      assert(passport.authenticate.calledWith(
				'local', {session: false}));
    })
		
    it('should expose middleware for the local auth strategy', function() {
			run();
			assert(auth.validateCredentials == 'authenticate');
    })
	
		describe('init', function() {
			let opts;
			
			before(function() {
				opts = {
					jwtFromRequest: sinon.match.func,
					secretOrKey: 'jwt_secret',
					algorithms: ['HS256'],
					ignoreExpiration: true
				};
			})
			
			beforeEach(function() {
				let prepare = run;
				run = () => {
					prepare();
					return auth.init();
				};
				config.jwtSecret = 'jwt_secret';
				passportLocal.Strategy = sinon.spy();
				pjwt.Strategy = sinon.spy();
				passport.use = sinon.spy();
				passport.initialize = sinon.spy();
			})
			
			it('should create a local authentication strategy', function() {
				run();
				assert(passportLocal.Strategy.called);
				assert(passportLocal.Strategy.calledOnce);
				assert(passportLocal.Strategy.calledWith(
					{
						usernameField: 'email',
						passwordField: 'password'
					},
					sinon.match.func));
			})
			
			it('should configure the app to use the local authentication strategy', function() {
				run();
				assert(passport.use.calledWith(new passportLocal.Strategy()));
			})
			
			it('should create a jwt authentication strategy', function() {
				run();
				assert(pjwt.Strategy.called);
				assert(pjwt.Strategy.calledOnce);
				assert(pjwt.Strategy.calledWith(opts, sinon.match.func));
			})
			
			it('should configure the app to use the jwt authentication strategy', function() {
				run();
				assert(passport.use.calledWith(new pjwt.Strategy()));
			})
			
			it('should configure the app to use the jwt authentication strategy', function() {
				run();
				assert(passport.initialize.called);
				assert(passport.initialize.calledOnce);
			})
		
			describe('jwt extract method', function() {
				let extractMethod = () => pjwt.Strategy.getCall(0).args[0].jwtFromRequest;
				
				beforeEach(function(){
					req.get = sinon.stub().withArgs('Authorization');
					req.cookies = { Authorization: 'cookie' };
				})
				
				it("should return the 'Authorization' header if present", function() {
					run();
					req.get.returns('header');
					assert(extractMethod()(req) == 'header');
				})
				
				it("should return the 'Authorization' cookie if the 'Authorization' header is not present", function() {
					run();
					req.get.returns(null);
					assert(extractMethod()(req) == 'cookie');
				})
			})
		
			describe('authenticate', function() {
				let email = 'email',
					password = 'password',
					done;
				
				beforeEach(function() {
					let prepare = run;
					run = () => {
						prepare();
						let authenticate = passportLocal.Strategy.getCall(0).args[1];
						return authenticate(email, password, done);
					}
					users.one = sinon.stub().returns(Promise.resolve(null));
					done = sinon.spy();
				})
				
				it('should get the user', function() {
					run();
					assert(users.one.called);
					assert(users.one.calledOnce);
					assert(users.one.calledWith(email));
				})
				
				describe('if no user is found', function(){
					it('should fail to authenticate', function() {
						return run().then(() => {
							assert(done.called);
							assert(done.calledOnce);
							assert(done.calledWith(null,false));
						})
					})
				})
				
				describe('if a user is found', function(){
					let user = {};
					
					beforeEach(function() {
						users.one = sinon.stub().returns(Promise.resolve(user));
						user.validPassword = sinon.stub().returns(false);
					});
					
					describe('but the password is not valid', function(){
						it('should fail to authenticate', function() {
							return run().then(() => {
								assert(done.called);
								assert(done.calledOnce);
								assert(done.calledWith(null,false));
							})
						})
					})
					
					describe('and the password is valid', function(){
						beforeEach(function() {
							user.validPassword.returns(true);
						});
					
						it('should authenticate successfully', function() {
							return run().then(() => {
								assert(done.called);
								assert(done.calledOnce);
								assert(done.calledWith(null, sinon.match.truthy));
							})
						})
					})
				})
			})
		})
		
		describe('validateToken', function() {
			let jwtMiddleware;
			
			beforeEach(function() {
				let prepare = run;
				run = () => {
					prepare();
					passport.authenticate = sinon.stub().returns(jwtMiddleware);
					return auth.validateToken(req, res, next);
				};
				res.locals = {id:'locals'};
				jwtMiddleware = sinon.spy();
			})
			
			it('should create middleware for the jwt auth strategy', function() {
				run();
				assert(passport.authenticate.called);
				assert(passport.authenticate.calledOnce);
				assert(passport.authenticate.calledWith(
					'jwt', {session: false}, sinon.match.func));
			})
			
			it('should execute the middleware for the local auth strategy', function() {
				run();
				assert(jwtMiddleware.called);
				assert(jwtMiddleware.calledOnce);
				assert(jwtMiddleware.calledWith(req,res,next));
			})
			
			describe('when the token is successfully validated', function() {
				let successCallback, user = 'user';
				beforeEach(function() {
					let prepare = run;
					run = () => {
						prepare();
						assert(passport.authenticate.calledOnce);
						successCallback = passport.authenticate.getCall(0).args[2];
						return successCallback(null,user);
					};
					next = sinon.spy();
				});
				it('should add the user to the request', function() {
					run();
					assert(req.user == user);
				})
				it('should add the user to the response', function() {
					run();
					assert(res.locals.user == user);
				})
				it("should invoke the 'next' callback", function() {
					run();
					assert(next.called);
					assert(next.calledOnce);
				})
			})
		})
		
		describe('respondWithSessionToken', function() {
			let user, options, token;
			before(function() {
				user = { id: 1 };
				options = { subject: user.id.toString() };
				token = 'token';
			})
			
			beforeEach(function() {
				let prepare = run;
				run = () => {
					prepare();
					auth.respondWithSessionToken(req, res);
				};
				req.user = user;
				res.cookie = sinon.spy();
				res.json = sinon.spy();
				jwt.sign = sinon.stub().returns(token);
			})
			
			it('should create a jwt token', function() {
				run();
				assert(jwt.sign.called);
				assert(jwt.sign.calledOnce);
				assert(jwt.sign.calledWith(
					{}, config.jwtSecret, options));
			})
			
			it('should add an auth cookie to the response headers', function() {
				run();
				assert(res.cookie.called);
				assert(res.cookie.calledOnce);
				assert(res.cookie.calledWith(
					'Authorization', token));
			})
			
			it('should create the response body', function() {
				run();
				assert(res.json.called);
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
})
