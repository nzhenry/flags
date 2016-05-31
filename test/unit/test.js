let chai = require('chai');
let assert = chai.assert;
let mockery = require('mockery');
let sinon = require('sinon');

beforeEach(function() {
	// hijack require(...)
	mockery.enable({
		warnOnUnregistered: false,
		warnOnReplace: false,
		useCleanCache: true
	});
});

afterEach(function() {
	// return require(...) to normal
	mockery.disable();
});

describe('api routes', function() {
	let express, router, auth;
	
	beforeEach(function() {
		// create mocks
		router = {
      get: sinon.spy(),
      post: sinon.spy(),
      put: sinon.spy()
    }
		express = { Router: () => router };
    auth = {
      validateCredentials: 'validateCredentials',
      respondWithSessionToken: sinon.spy(),
      verifyCaptcha: 'verifyCaptcha',
      sendResetPasswordLink: 'sendResetPasswordLink',
      signup: 'signup'
    };

		// replace required modules with mocks
		mockery.registerMock('express', express);
		mockery.registerMock('../lib/auth', auth);
		mockery.registerMock('../lib/config', {});
		mockery.registerMock('../lib/emailer', {});
		mockery.registerMock('../lib/model/users', {});
		mockery.registerMock('../lib/model/flags', {});
    
    require('../../routes/api');
	});
    
  it('sets up the login route', function() {
    assert(router.post.calledWith('/login',
      auth.validateCredentials,
      sinon.match.func));
    
    let req = { user: 'user' }, res = 'res';
    router.post.getCall(0).args[2](req, res);
    assert(auth.respondWithSessionToken.calledWith(req.user,res));
  });
    
  it('sets up the signup route', function() {
    assert(router.post.calledWith('/signup',
      auth.verifyCaptcha,
      auth.signup));
  });
});
