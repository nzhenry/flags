var chai = require("chai");
var assert = chai.assert;
var uuid = require('node-uuid');
var fs = require('fs');

var mailPath = 'test/mock-smtp/mail/';

describe('popups', function() {
  beforeEach(function() {
    browser.setViewportSize({width: 800, height: 600}, false);
    browser.url('/');
  });
  
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
  
  describe('"reset password" popup', () => {
    beforeEach(function() {
      browser.waitForVisible('#loginButton');
      browser.click('#loginButton');
      browser.waitForVisible('#loginModal #resetPasswordLink');
      browser.pause(200);
      browser.click('#loginModal #resetPasswordLink');
      browser.waitForVisible('#resetPasswordModal');
    });
    it('should have an email address input', () => {
      assert.isTrue(browser.isVisible('#resetPasswordModal #emailInput'));
    });
    it('should have a recaptcha input', () => {
      assert.isTrue(browser.isVisible('#resetPasswordModal #captcha > div > div > iframe'));
    });
    it('should have a close button', () => {
      assert.isTrue(browser.isVisible('#resetPasswordModal #closeButton'));
    });
    it('should have a "reset password" button', () => {
      assert.isTrue(browser.isVisible('#resetPasswordModal #resetPasswordButton'));
    });
  
    describe('if an unknown email address is entered', () => {
      beforeEach(function() {
        browser.setValue('#resetPasswordModal #emailInput',`${uuid.v4()}@test`);
      });
      describe('and the recaptcha has been completed', () => {
        beforeEach(function() {
          browser.frame(0);
          browser.click('#recaptcha-anchor');
          browser.waitForExist('#recaptcha-anchor.recaptcha-checkbox-checked');
          browser.frame();
        });
        describe('when the "reset password" button is clicked', () => {
          beforeEach(function() {
            browser.click('#resetPasswordModal #resetPasswordButton');
          });
          it('should show an error message', ()=> {
            browser.waitForVisible('#resetPasswordModal div.alert-danger');
            assert.equal(browser.getText(
                '#resetPasswordModal div.alert-danger'),
                "No account found with that email address");
          });
        });
      });
    });
    
    describe('if a known email address is entered', () => {
      beforeEach(function() {
        browser.setValue('#resetPasswordModal #emailInput', 'testuser@e2e-test');
      });
      describe('and the recaptcha has been completed', () => {
        beforeEach(function() {
          browser.frame(0);
          browser.click('#recaptcha-anchor');
          browser.waitForExist('#recaptcha-anchor.recaptcha-checkbox-checked');
          browser.frame();
        });
        describe('when the "reset password" button is clicked', () => {
          beforeEach(function() {
            browser.click('#resetPasswordModal #resetPasswordButton');
          });
          it('should show a confirmation message', ()=> {
            browser.waitForVisible('#resetPasswordModal div.alert-info');
            assert.equal(browser.getText(
                '#resetPasswordModal div.alert-info'),
                "An email has been sent with instructions on how to reset your password");
          });
          it('should have sent a password reset email to the given email address', ()=> {
            var filenames = fs.readdirSync(mailPath);
            var filename = mailPath + filenames.sort()[filenames.length-1];
            var email = fs.readFileSync(filename, 'utf-8');
            assert(/To: testuser@e2e-test/.test(email));
            assert(/Subject: Password Reset/.test(email));
          });
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
