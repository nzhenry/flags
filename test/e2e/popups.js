var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var assert = chai.assert;
var webdriver = require('../webdriver');
var uuid = require('node-uuid');

chai.use(chaiAsPromised);

describe('popups', function() {
  this.timeout(33333);
  
  before(function() {
    return page = webdriver.init('/');
  });
  
  after(() => page.end());
  
  describe('onramp popup', () => {
    it('should show a message telling the user they "need to be logged in to use this feature"');
    it('should have a login button');
    it('should have a signup button');
    it('should have a close button');
  });

  //an abstract popup that acts as a base for both the login and signup popups
  describe('auth popup', () => {
    it('should have a google button');
    it('should have a facebook button');
    it('should have a twitter button');
    it('should have an email input');
    it('should have a password input');
    it('should have a close button');

    describe('when the google button is clicked', () => {
      it('should send a google login request');
    });

    describe('when the facebook button is clicked', () => {
      it('should send a facebook login request');
    });

    describe('when the twitter button is clicked', () => {
      it('should send a twitter login request');
    });

    describe('when the close button is clicked', () => {
      it('should close the popup');
    });
  });

  describe('login popup', () => {
    it('should have a "forgot password" button');
    it('should have a login button');
    it('should have a signup button');
  
    describe('when the "forgot password" button is clicked', () => {
      it('should show the "reset password" popup');
    });

    describe('when the login button is clicked', () => {
      it('should send a login request');
      describe('if successful', () => {
        it('should close the popup');
      });
      describe('if unsuccessful', () => {
        it('should show an error message');
      });
    });

    describe('when the signup button is clicked', () => {
      it('should switch to the signup popup');
    });
  });
  
  function wait(timeout) {
    return new Promise(f => setTimeout(f, timeout));
  }

  describe('"reset password" popup', () => {
    before(function() {
      return page.click('#loginButton')
        .then(()=> page.waitForVisible('#loginModal'))
        .then(()=> wait(200))
        .then(()=> page.click('#resetPasswordLink'))
        .then(()=> page.waitForVisible('#resetPasswordModal'));
    });
    it('should have an email address input', () => {
      return assert.eventually.isTrue(page.isVisible('#resetPasswordModal #emailInput'));
    });
    it('should have a recaptcha input', () => {
      return assert.eventually.isTrue(page.isVisible('#resetPasswordModal #captcha > div > div > iframe'));
    });
    it('should have a close button', () => {
      return assert.eventually.isTrue(page.isVisible('#resetPasswordModal #closeButton'));
    });
    it('should have a "reset password" button', () => {
      return assert.eventually.isTrue(page.isVisible('#resetPasswordModal #resetPasswordButton'));
    });
  
    describe('when the "reset password" button is clicked', () => {
      describe('if no email address has been entered', () => {
        it('should show an error message');
      });
  
      describe('if an email address has been entered', () => {
        describe('if a user with the given email address exists', () => {
          it('should send a password reset email to the given email address');
          it('should show a confirmation message');
        });
    
        describe('if there is no user with the given email address', () => {
          it('should show a failure message');
        });
      });
    });
  });

  describe('signup popup', () => {
    it('should have a login button');
    it('should have a recaptcha input');
    it('should have a signup button');

    describe('when the signup button is clicked', () => {
      it('should send a signup request');
      describe('if successful', () => {
        it('should close the popup');
      });
      describe('if unsuccessful', () => {
        it('should show an error message');
      });
    });

    describe('when the login button is clicked', () => {
      it('should switch to the login popup');
    });
  });

  describe('"Add to my collection" popup', () => {
    it('should have a "I like this flag" button"');
    it('should have a "I like this flag a lot" button"');
    it('should have a "This is my favourite flag" button"');
    it('should have a cancel button"');
  });
});
