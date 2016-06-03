let chai = require('chai');
let assert = chai.assert;
let mockery = require('mockery');
let sinon = require('sinon');

describe('api routes', function() {
	let express, router, auth, data;
	
	beforeEach(function() {
    // hijack require(...)
    mockery.enable({
      warnOnUnregistered: false,
      warnOnReplace: false,
      useCleanCache: true
    });
  
		// create mocks
		router = {
      get: sinon.spy(),
      post: sinon.spy(),
      put: sinon.spy()
    }
		express = { Router: () => router };
    auth = {
      validateCredentials: 'validateCredentials',
      respondWithSessionToken: 'respondWithSessionToken',
      verifyCaptcha: 'verifyCaptcha',
      sendResetPasswordLink: 'sendResetPasswordLink',
      signup: 'signup'
    };
    data = {
      flag: 'flag',
      flags: 'flags'
    };

		// replace required modules with mocks
		mockery.registerMock('express', express);
		mockery.registerMock('../lib/auth', auth);
		mockery.registerMock('../lib/config', {});
		mockery.registerMock('../lib/emailer', {});
		mockery.registerMock('../lib/data', data);
    
    require('../../../routes/api');
	});

  afterEach(function() {
    // return require(...) to normal
    mockery.disable();
  });
    
  it('sets up the login route', function() {
    assert(router.post.calledWith('/login',
      auth.validateCredentials,
      auth.respondWithSessionToken));
  });
    
  it('sets up the signup route', function() {
    assert(router.post.calledWith('/signup',
      auth.verifyCaptcha,
      auth.signup,
      auth.respondWithSessionToken));
  });
    
  it('sets up the sendResetPasswordLink route', function() {
    assert(router.post.calledWith('/sendResetPasswordLink',
      auth.verifyCaptcha,
      auth.sendResetPasswordLink));
  });
    
  it('sets up the verifyPasswordResetToken route', function() {
    assert(router.get.calledWith('/verifyPasswordResetToken/:token',
      auth.verifyPwdResetToken,
      auth.respondWithSessionToken));
  });
    
  it('sets up the resetPassword route', function() {
    assert(router.post.calledWith('/resetPassword',
      auth.verifyPwdResetToken,
      auth.setNewUserPassword,
      auth.respondWithSessionToken));
  });
    
  it('sets up the flag route', function() {
    assert(router.get.calledWith('/flags/:id', data.flag));
  });
    
  it('sets up the flags route', function() {
    assert(router.get.calledWith('/flags', data.flags));
  });
});
