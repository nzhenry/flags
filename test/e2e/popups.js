var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var assert = chai.assert;
var webdriver = require('../webdriver');
var uuid = require('node-uuid');
var fs = require('fs-promise');
var config = require('../../lib/config');

chai.use(chaiAsPromised);

var mailPath = 'test/mock-smtp/mail/';

describe('popups', function() {
  this.timeout(33333);
  
  before(function() {
    page = webdriver.init('/');
    page.setViewportSize({width: 800, height: 600}, false);
    return page;
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
      return page.waitForVisible('#loginButton')
        .then(()=> page.click('#loginButton'))
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
  
    describe('if an unknown email address is entered', () => {
      before(function() {
        return page.setValue('#resetPasswordModal #emailInput',`${uuid.v4()}@test`);
      });
      describe('and the recaptcha has been completed', () => {
        before(function() {
          return page.frame(0)
            .then(()=> page.click('#recaptcha-anchor'))
            .then(()=> page.waitForExist('#recaptcha-anchor.recaptcha-checkbox-checked'))
            .then(()=> page.frame());
        });
        describe('when the "reset password" button is clicked', () => {
          before(function() {
            return page.click('#resetPasswordModal #resetPasswordButton');
          });
          it('should show an error message', ()=> {
            return page.waitForVisible('#resetPasswordModal div.alert-danger')
              .then(()=> assert.eventually.equal(page.getText(
                '#resetPasswordModal div.alert-danger'),
                "No account found with that email address"));
          });
        });
      });
    });
    
    describe('if a known email address is entered', () => {
      before(function() {
        return page.setValue('#resetPasswordModal #emailInput', 'testuser@e2e-test');
      });
      describe('and the recaptcha has been completed', () => {
        before(function() {
          return page.frame(0)
            .then(()=> page.click('#recaptcha-anchor'))
            .then(()=> page.waitForExist('#recaptcha-anchor.recaptcha-checkbox-checked'))
            .then(()=> page.frame());
        });
        describe('when the "reset password" button is clicked', () => {
          before(function() {
            return page.click('#resetPasswordModal #resetPasswordButton');
          });
          it('should show a confirmation message', ()=> {
            return page.waitForVisible('#resetPasswordModal div.alert-info')
              .then(()=> assert.eventually.equal(page.getText(
                '#resetPasswordModal div.alert-info'),
                "An email has been sent with instructions on how to reset your password"));
          });
          it('should have sent a password reset email to the given email address', ()=> {
            return fs.readdir(mailPath)
              .then(filenames => mailPath + filenames.sort()[filenames.length-1])
              .then(filename => fs.readFile(filename, 'utf-8'))
              .then(email => {
                assert(/To: testuser@e2e-test/.test(email));
                assert(/Subject: Password Reset/.test(email));
              });
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
