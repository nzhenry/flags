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
	let auth, passport, passportLocal, users;
	
	before(function() {
		// create mocks
		passport = {
      authenticate: sinon.stub().returns('authenticate'),
			use: sinon.spy(),
			initialize: sinon.spy()
    }
		passportLocal = {}
		users = {}

		// replace required modules with mocks
		mockery.registerMock('./model/users', users);
		// mockery.registerMock('./errors/errorCodes', {});
		// mockery.registerMock('./errors/errorUtils', {});
		// mockery.registerMock('./errors/ApiError', {});
		
		mockery.registerMock('passport', passport);
		mockery.registerMock('passport-local', passportLocal);
	})
  
  describe('require', function() {
		beforeEach(function() {
			auth = require('../../../lib/auth');
		});
		
    it('should create authentication middleware', function() {
      assert(passport.authenticate.calledWith(
				'local', {session: false}));
    })
		
    it('should expose authentication middleware', function() {
			assert(auth.validateCredentials == 'authenticate');
    })
  })
	
	describe('init', function() {
		before(function() {
			passportLocal.Strategy = sinon.spy()
		})
		
		beforeEach(function(){
			auth.init();
		})
		
    it('should create a local authentication strategy', function() {
      assert(passportLocal.Strategy.calledWith(
				{
					usernameField: 'email',
					passwordField: 'password'
				},
				sinon.match.func));
    })
		
    it('should configure the app to use the local authentication strategy', function() {
			console.log(passport.use.getCall(0).args[0]);
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
			assert(users.one.calledWith(email));
		})
		
		describe('if no user is found', function(){
			it('fshould fail to authenticate', function() {
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
					assert(done.calledWith(null,false));
				})
			})
			
			describe('and the password is valid', function(){
				before(function() {
					user.validPassword.returns(true);
				});
			
				it('should authenticate successfully', function() {
					assert(done.calledWith(null, sinon.match.truthy));
				})
			})
		})
	})
	
	describe('validateToken', function() {
		
	})
})
