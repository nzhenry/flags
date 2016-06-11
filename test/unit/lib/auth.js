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
			users,
			sandbox;
	
	function local(lib) {
		return '../../../lib/' + lib;
	}
	
	function getRequires() {
		config = require(local('config'));
		config.db = null;// do this first to prevent a db connection from opening
		passport = require('passport');
		pjwt = require('passport-jwt');
		passportLocal = require('passport-local');
		http = require('request-promise');
		emailer = require(local('emailer'));
		errorUtils = require(local('errors/errorUtils'));
		jwt = require(local('jwt/jwt-promise'));
		users = require(local('model/users'));
	}
	
  describe('require', function() {
		let auth, spy, run, req, res, next;

		function addToRun(func) {
			let prepare = run;
			run = () => {
				var result = prepare();
				return result && result.then ? result.then(func) : func();
			};
		}
		
		afterEach(function() {
			sandbox.restore();
		})
		
		beforeEach(function() {
			sandbox = sinon.sandbox.create();
			getRequires();
			req = {
				id: 'req',
				body: {}
			};
			res = {
				cookie: sandbox.spy(),
				json: sandbox.spy(),
				locals: {id:'locals'},
				send: sandbox.spy()
			};
			next = sandbox.spy();
			run = () => { return auth = require(local('auth')) }
			passport.authenticate = sandbox.stub(passport, 'authenticate')
			passport.authenticate.returns('authenticate');
			errorUtils.jsonError = sandbox.stub();
			errorUtils.jsonError.returns('json error');
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
				passportLocal.Strategy = sandbox.spy();
				pjwt.Strategy = sandbox.spy();
				passport.use = sandbox.spy();
				passport.initialize = sandbox.spy();
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
				let authorization = 'Authorization';
				let extractMethod = () => pjwt.Strategy.getCall(0).args[0].jwtFromRequest;
				
				beforeEach(function(){
					req.get = sandbox.stub();
					req.cookies = { Authorization: 'cookie' };
				})
				
				it("should return the 'Authorization' header if present", function() {
					run();
					req.get.withArgs(authorization).returns('header');
					assert.equal(extractMethod()(req), 'header');
				})
				
				it("should return the 'Authorization' cookie if the 'Authorization' header is not present", function() {
					run();
					req.get.withArgs(authorization).returns(null);
					assert.equal(extractMethod()(req), 'cookie');
				})
			})
		
			describe('on jwt authenticate success', function() {
				let payload, done;

				beforeEach(function() {
					addToRun(() => {
						let onJwtAuthenticateSuccess = pjwt.Strategy.getCall(0).args[1];
						return onJwtAuthenticateSuccess(payload, done);
					});
					users.one = sandbox.stub();
					users.one.returns(Promise.resolve('user'));
					payload = { sub: '1' };
					done = sandbox.spy();
				})

				it('should get a user', function() {
					run();
					assert(users.one.called);
					assert(users.one.calledOnce);
					assert(users.one.calledWithExactly(1));
				})

				it('should invoke the callback with the user', function() {
					return run().then(() => {
						assert(done.called);
						assert(done.calledOnce);
						assert(done.calledWithExactly(null, 'user'));
					});
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
					users.one = sandbox.stub();
					users.one.returns(Promise.resolve());
					done = sandbox.spy();
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
						users.one = sandbox.stub();
						users.one.returns(Promise.resolve(user));
						user.validPassword = sandbox.stub();
						user.validPassword.returns(false);
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
					passport.authenticate.returns(jwtMiddleware);
					return auth.validateToken(req, res, next);
				});
				jwtMiddleware = sandbox.spy();
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
				jwt.sign = sandbox.stub();
				jwt.sign.returns(token);
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
			let data, requestOpts = {
				uri: 'https://www.google.com/recaptcha/api/siteverify',
				form: {
					secret: 'recaptchaSecret',
					response: 'captcha'
				}
			};
			
			beforeEach(function() {
				addToRun(() => auth.verifyCaptcha(req, res, next));
				config.recaptchaSecret = 'recaptchaSecret';
				req.body.captcha = 'captcha';
				http.post = sandbox.stub();
			})
			
			describe('if http.post returns an error', function(){
				beforeEach(function(){
					http.post.withArgs(requestOpts).returns(Promise.reject('error'));
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
					http.post.withArgs(requestOpts).returns(Promise.resolve());
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
					http.post.withArgs(requestOpts).returns(Promise.resolve('{}'));
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
					http.post.withArgs(requestOpts).returns(Promise.resolve('{"success":true}'));
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
			let email = 'email', password = 'password';
			beforeEach(function() {
				addToRun(() => auth.signup(req, res, next));
				users.create = sandbox.stub();
				req.body.email = 'email';
				req.body.password = 'password';
			})
			
			describe('when users.create returns a user', function() {
				beforeEach(function() {
					users.create.withArgs(email, password)
						.returns(Promise.resolve('user'));
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
					users.create.withArgs(email, password)
						.returns(Promise.reject({code:23505})); // 23505 = PSQL unique constraint violation
				})
				
				it('should respond with an error message formatted in json', function() {
					return run().then(() => {
						assert(errorUtils.jsonError.calledWithExactly(
							errorCodes.emailClash,
							'An account with that email address already exists'));
						assert(res.json.called);
						assert(res.json.calledOnce);
						assert(res.json.calledWithExactly('json error'));
					});
				})
			})
			
			describe('when users.create is rejected', function() {
				beforeEach(function() {
					users.create.withArgs(email, password)
						.returns(Promise.reject('error'));
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
			let email = 'email';
			beforeEach(function() {
				addToRun(() => auth.sendResetPasswordLink(req, res, next));
				req.body.email = 'email';
				users.one = sandbox.stub();
				emailer.sendResetPasswordLink = sandbox.spy();
			})
			
			describe('if users.one is rejected', function() {
				beforeEach(function() {
					users.one.withArgs(email).returns(Promise.reject('error'));
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
					users.one.withArgs(email).returns(Promise.resolve('user'));
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
					users.one.withArgs(email).returns(Promise.resolve());
				})
				
				it('should not send a password reset email', function() {
					return run().then(() => {
						assert.isFalse(emailer.sendResetPasswordLink.called);
					});
				})
				
				it('should respond with an error message formatted in json', function() {
					return run().then(() => {
						assert(errorUtils.jsonError.calledWithExactly(
							errorCodes.accountNotFound,
							'No account found with that email address'));
						assert(res.json.called);
						assert(res.json.calledOnce);
						assert(res.json.calledWithExactly('json error'));
					});
				})
			})
		})
		
		describe('verify password reset token', function() {
			let verifyStub, verifyResult = Promise.resolve();

			beforeEach(function() {
				addToRun(() => auth.verifyPwdResetToken(req, res, next));
				req.params = {token: 'paramsToken'};
				req.body = {token: 'bodyToken'};
				verifyStub = sandbox.stub(jwt, 'verify', () => verifyResult);
				config.jwtSecret = 'jwt_secret';
			})
				
			it('should use the configured jwt secret', function() {
				run();
				assert(verifyStub.calledWith(sinon.match.string, 'jwt_secret'));
			})
			
			describe('if the request method is GET', function() {
				beforeEach(function() {
					req.method = 'GET';
				})
				
				it('should get the token from the request params', function() {
					run();
					assert(verifyStub.calledWith('paramsToken'));
				})
			})
			
			describe('if the request method is POST', function() {
				beforeEach(function() {
					req.method = 'POST';
				})
				
				it('should get the token from the request body', function() {
					run();
					assert(verifyStub.calledWith('bodyToken'));
				})
			})
			
			describe('if jwt.verify is rejected', function() {
				describe('with an unexpected error', function() {
					beforeEach(function() {
						verifyResult = Promise.reject('error');
					})
					
					it('should pass on the error', function() {
						return run().then(() => {
							assert(next.called);
							assert(next.calledOnce);
							assert(next.calledWithExactly('error'));
						});
					})
				})

				describe('with a TokenExpiredError error', function() {
					beforeEach(function() {
						verifyResult = Promise.reject({name: 'TokenExpiredError'});
					})
					
					it("should respond with a 'token expired' error", function() {
						return run().then(() => {
							assert(errorUtils.jsonError.calledWith(errorCodes.expiredToken))
							assert(res.json.called);
							assert(res.json.calledOnce);
							assert(res.json.calledWith('json error'));
						});
					})
				})

				describe('with a JsonWebTokenError error', function() {
					beforeEach(function() {
						verifyResult = Promise.reject({name: 'JsonWebTokenError'});
					})
					
					it("should respond with a 'malformed token' error", function() {
						return run().then(() => {
							assert(errorUtils.jsonError.calledWith(errorCodes.malformedToken))
							assert(res.json.called);
							assert(res.json.calledOnce);
							assert(res.json.calledWith('json error'));
						});
					})
				})
			})
			
			describe('if jwt.verify is successful', function() {
				let user;

				beforeEach(function() {
					verifyResult = Promise.resolve({sub: '1', prk: 'prk'});
					users.one = sandbox.stub();
				})
				
				it('should get the user', function() {
					return run().then(() => {
						assert(users.one.called);
						assert(users.one.calledOnce);
						assert(users.one.calledWithExactly(1));
					});
				})
			
				describe('but no user is found', function() {
					beforeEach(function() {
						users.one.returns(Promise.resolve(user));
					})
					
					it("should respond with a 'user not found' error", function() {
						return run().then(() => {
							assert(errorUtils.jsonError.calledWith(errorCodes.accountNotFound))
							assert(res.json.called);
							assert(res.json.calledOnce);
							assert(res.json.calledWith('json error'));
						});
					})
				})
			
				describe('and a user is found', function() {
					describe('and the password reset key matches the one in the user record', function() {
						beforeEach(function() {
							user = {
								pwd_reset_key: 'prk'
							};
							users.one.returns(Promise.resolve(user));
						})
						
						it('should add the user to the request object', function() {
							return run().then(() => {
								assert.equal(user, req.user);
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
			
					describe('but the password reset key does not match the one in the user record', function() {
						beforeEach(function() {
							user = {
								pwd_reset_key: 'something else'
							};
							users.one.returns(Promise.resolve(user));
						})
						
						it('should not add the user to the request object', function() {
							return run().then(() => {
								assert.isUndefined(req.user);
							});
						})
					
						it("should respond with a 'key mismatch' error", function() {
							return run().then(() => {
								assert(errorUtils.jsonError.calledWith(errorCodes.keyMismatch));
								assert(res.json.called);
								assert(res.json.calledOnce);
								assert(res.json.calledWith('json error'));
							});
						})
					})
			
					describe('but the user record has no password reset key', function() {
						beforeEach(function() {
							user = {};
							users.one.returns(Promise.resolve(user));
						})
						
						it('should not add the user to the request object', function() {
							return run().then(() => {
								assert.isUndefined(req.user);
							});
						})
					
						it("should respond with a 'used token' error", function() {
							return run().then(() => {
								assert(errorUtils.jsonError.calledWith(errorCodes.usedToken));
								assert(res.json.called);
								assert(res.json.calledOnce);
								assert(res.json.calledWith('json error'));
							});
						})
					})
				})
			})
		})
		
		describe('set new user password', function() {
			beforeEach(function() {
				addToRun(() => auth.setNewUserPassword(req, res, next));
				req.user = { newPassword: sandbox.stub() };
				req.body = { password: 'password' };
			})
			
			describe('if user.newPassword is rejected', function() {
				beforeEach(function() {
					req.user.newPassword.withArgs('password')
						.returns(Promise.reject('error'));
				})
				
				it('should pass on the error', function() {
					return run().then(() => {
						assert(next.called)
						assert(next.calledOnce)
						assert(next.calledWithExactly('error'))
					});
				})
			})
			
			describe('if user.newPassword is successful', function() {
				beforeEach(function() {
					req.user.newPassword.withArgs('password')
						.returns(Promise.resolve());
				})
				
				it('should call next', function() {
					return run().then(() => {
						assert(next.called)
						assert(next.calledOnce)
						assert(next.calledWithExactly())
					});
				})
			})
		})
  })
})
