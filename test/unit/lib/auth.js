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

		function addToRun(func) {
			let prepare = run;
			run = () => {
				var result = prepare();
				return result && result.then ? result.then(func) : func();
			};
		}
		
		beforeEach(function() {
			req = {
				id: 'req',
				body: {}
			};
			res = {
				cookie: sinon.spy(),
				json: sinon.spy(),
				locals: {id:'locals'},
				send: sinon.spy()
			};
			next = sinon.spy();
			run = () => { return auth = require(local('auth')) }
			passport.authenticate = sinon.stub().returns('authenticate');
		})
		
    it('should create middleware for the local auth strategy', function() {
			run();
			assert(passport.authenticate.called);
			assert(passport.authenticate.calledOnce);
      assert(passport.authenticate.calledWithExactly(
				'local', {session: false}));
    })
		
    it('should expose middleware for the local auth strategy', function() {
			run();
			assert.equal(auth.validateCredentials, 'authenticate');
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
				addToRun(() => auth.init());
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
				assert(passportLocal.Strategy.calledWithExactly(
					{
						usernameField: 'email',
						passwordField: 'password'
					},
					sinon.match.func));
			})
			
			it('should configure the app to use the local authentication strategy', function() {
				run();
				assert(passport.use.calledWithExactly(new passportLocal.Strategy()));
			})
			
			it('should create a jwt authentication strategy', function() {
				run();
				assert(pjwt.Strategy.called);
				assert(pjwt.Strategy.calledOnce);
				assert(pjwt.Strategy.calledWithExactly(opts, sinon.match.func));
			})
			
			it('should configure the app to use the jwt authentication strategy', function() {
				run();
				assert(passport.use.calledWithExactly(new pjwt.Strategy()));
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
					assert.equal(extractMethod()(req), 'header');
				})
				
				it("should return the 'Authorization' cookie if the 'Authorization' header is not present", function() {
					run();
					req.get.returns(null);
					assert.equal(extractMethod()(req), 'cookie');
				})
			})
		
			describe('authenticate', function() {
				let email = 'email',
					password = 'password',
					done;
				
				beforeEach(function() {
					addToRun(() => {
						let authenticate = passportLocal.Strategy.getCall(0).args[1];
						return authenticate(email, password, done);
					});
					users.one = sinon.stub().returns(Promise.resolve(null));
					done = sinon.spy();
				})
				
				it('should get the user', function() {
					run();
					assert(users.one.called);
					assert(users.one.calledOnce);
					assert(users.one.calledWithExactly(email));
				})
				
				describe('if no user is found', function(){
					it('should fail to authenticate', function() {
						return run().then(() => {
							assert(done.called);
							assert(done.calledOnce);
							assert(done.calledWithExactly(null,false));
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
								assert(done.calledWithExactly(null,false));
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
								assert(done.calledWithExactly(null, sinon.match.truthy));
							})
						})
					})
				})
			})
		})
		
		describe('validateToken', function() {
			let jwtMiddleware;
			
			beforeEach(function() {
				addToRun(() => {
					passport.authenticate = sinon.stub().returns(jwtMiddleware);
					return auth.validateToken(req, res, next);
				});
				jwtMiddleware = sinon.spy();
			})
			
			it('should create middleware for the jwt auth strategy', function() {
				run();
				assert(passport.authenticate.called);
				assert(passport.authenticate.calledOnce);
				assert(passport.authenticate.calledWithExactly(
					'jwt', {session: false}, sinon.match.func));
			})
			
			it('should execute the middleware for the local auth strategy', function() {
				run();
				assert(jwtMiddleware.called);
				assert(jwtMiddleware.calledOnce);
				assert(jwtMiddleware.calledWithExactly(req,res,next));
			})
			
			describe('when the token is successfully validated', function() {
				let successCallback, user = 'user';
				beforeEach(function() {
					addToRun(() => {
						assert(passport.authenticate.calledOnce);
						successCallback = passport.authenticate.getCall(0).args[2];
						return successCallback(null,user);
					});
				});
				it('should add the user to the request', function() {
					run();
					assert.equal(req.user, user);
				})
				it('should add the user to the response', function() {
					run();
					assert.equal(res.locals.user, user);
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
				addToRun(() => auth.respondWithSessionToken(req, res));
				req.user = user;
				jwt.sign = sinon.stub().returns(token);
			})
			
			it('should create a jwt token', function() {
				run();
				assert(jwt.sign.called);
				assert(jwt.sign.calledOnce);
				assert(jwt.sign.calledWithExactly(
					{}, config.jwtSecret, options));
			})
			
			it('should add an auth cookie to the response headers', function() {
				run();
				assert(res.cookie.called);
				assert(res.cookie.calledOnce);
				assert(res.cookie.calledWithExactly(
					'Authorization', token));
			})
			
			it('should create the response body', function() {
				run();
				assert(res.json.called);
				assert(res.json.calledOnce);
				assert(res.json.calledWithExactly({
					user:{
						id: user.id,
						email: user.email
					},
					jwt: token
				}));
			})
		})
		
		describe('verifyCaptcha', function() {
			let data;
			
			beforeEach(function() {
				addToRun(() => auth.verifyCaptcha(req, res, next));
				config.recaptchaSecret = 'recaptchaSecret';
				req.body.captcha = 'captcha';
				// http.post = sinon.stub().returns(Promise.resolve(null));
				http.post = sinon.stub().withArgs({
					uri: 'https://www.google.com/recaptcha/api/siteverify',
					form: {
						secret: 'recaptchaSecret',
						response: 'captcha'
					}
				});
				errorUtils.jsonError = sinon.stub().returns('json error');
			})
			
			describe('if http.post returns an error', function(){
				beforeEach(function(){
					http.post.returns(Promise.reject('error'));
				})
				
				it('should pss on the error', function() {
					return run()
						.then(() => {
							assert(next.called);
							assert(next.calledOnce);
							assert(next.calledWithExactly('error'));
						});
				})
			})
			
			describe('if http.post returns a non-json response', function() {
				beforeEach(function(){
					http.post.returns(Promise.resolve(null));
				})
				
				it('should pass on the error thrown by JSON.parse', function() {
					return run()
						.then(() => {
							assert(next.called);
							assert(next.calledOnce);
						});
				})
			})
			
			describe("if the reponse doesn't contain 'success'", function() {
				beforeEach(function() {
					http.post.returns(Promise.resolve('{}'));
				})
				
				it('should create an error and return it as json', function() {
					return run()
						.then(() => {
							assert(res.json.called);
							assert(res.json.calledOnce);
							assert(res.json.calledWithExactly('json error'));
						});
				})
			})
			
			describe("if the reponse contains 'success'", function() {
				beforeEach(function() {
					http.post.returns(Promise.resolve('{"success":true}'));
				})
				
				it('should call next', function() {
					return run()
						.then(() => {
							assert(next.called);
							assert(next.calledOnce);
							assert(next.calledWithExactly());
						});
				})
			})
		})
		
		describe('signup', function() {
			beforeEach(function() {
				addToRun(() => auth.signup(req, res, next));
				users.create = sinon.stub().withArgs('email', 'password');
				req.body.email = 'email';
				req.body.password = 'password';
			})
			
			describe('when users.create returns a user', function() {
				beforeEach(function() {
					users.create.returns(Promise.resolve('user'));
				})
				
				it('should add the user to the request object', function() {
					return run().then(() => {
						assert.equal('user', req.user);
					});
				})
				
				it('should call next', function() {
					return run().then(() => {
						assert(next.called);
						assert(next.calledOnce);
						assert(next.calledWithExactly());
					});
				})
			})
			
			describe('when users.create is rejected with error code 23505', function() {
				beforeEach(function() {
					users.create.returns(Promise.reject({code:23505})); // 23505 = PSQL unique constraint violation
					errorUtils.jsonError = sinon.stub().withArgs(
							errorCodes.emailClash,
							'An account with that email address already exists')
						.returns('error');
				})
				
				it('should respond with an error message formatted in json', function() {
					return run().then(() => {
						assert(res.json.called);
						assert(res.json.calledOnce);
						assert(res.json.calledWithExactly('error'));
					});
				})
			})
			
			describe('when users.create is rejected', function() {
				beforeEach(function() {
					users.create.returns(Promise.reject('error'));
				})
				
				it('should pass on the error', function() {
					return run().then(() => {
						assert(next.called);
						assert(next.calledOnce);
						assert(next.calledWithExactly('error'));
					});
				})
			})
		})
		
		describe('send reset password link', function() {
			beforeEach(function() {
				addToRun(() => auth.sendResetPasswordLink(req, res, next));
				req.body.email = 'email';
				users.one = sinon.stub().withArgs('email');
				emailer.sendResetPasswordLink = sinon.spy();
			})
			
			describe('if users.one is rejected', function() {
				beforeEach(function() {
					users.one.returns(Promise.reject('error'));
				})
				
				it('should pass on the error', function() {
					return run().then(() => {
						assert(next.called);
						assert(next.calledOnce);
						assert(next.calledWithExactly('error'));
					});
				})
			})
			
			describe('if a user is found', function() {
				beforeEach(function() {
					users.one.returns(Promise.resolve('user'));
				})
				
				it('should send a password reset email to that user', function() {
					return run().then(() => {
						assert(emailer.sendResetPasswordLink.called);
						assert(emailer.sendResetPasswordLink.calledOnce);
						assert(emailer.sendResetPasswordLink.calledWithExactly('user'));
					});
				})
				
				it('should respond with an appropriate success message', function() {
					return run().then(() => {
						assert(res.send.called);
						assert(res.send.calledOnce);
						assert(res.send.calledWithExactly(
							'An email has been sent with instructions on how to reset your password'));
					});
				})
			})
			
			describe('if no user is found', function() {
				beforeEach(function() {
					users.one.returns(Promise.resolve(null));
					errorUtils.jsonError = sinon.stub().withArgs(
							errorCodes.accountNotFound,
							'No account found with that email address')
						.returns('error');
				})
				
				it('should not send a password reset email', function() {
					return run().then(() => {
						assert.isFalse(emailer.sendResetPasswordLink.called);
					});
				})
				
				it('should respond with an error message formatted in json', function() {
					return run().then(() => {
						assert(res.json.called);
						assert(res.json.calledOnce);
						assert(res.json.calledWithExactly('error'));
					});
				})
			})
		})
		
		describe('verify password reset token', function() {
			beforeEach(function() {
				addToRun(() => auth.verifyPwdResetToken(req, res, next));
			})
			
		// 	describe('bla', function() {
		// 		beforeEach(function() {
		// 		})
				
		// 		it('', function() {
		// 			run();
		// 		})
		// 	})
		})
		
		describe('verifyJWT', function() {
			beforeEach(function() {
				addToRun(() => {

				});
			})
			
		// 	describe('bla', function() {
		// 		beforeEach(function() {
		// 		})
				
		// 		it('', function() {
		// 			run();
		// 		})
		// 	})
		})
		
		describe('getInvalidPwdResetTokenResponse', function() {
			beforeEach(function() {
				addToRun(() => {
					
				});
			})
			
		// 	describe('bla', function() {
		// 		beforeEach(function() {
		// 		})
				
		// 		it('', function() {
		// 			run();
		// 		})
		// 	})
		})
  })
})
