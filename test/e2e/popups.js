var assert = require('assert');
var webdriver = require('../webdriver');

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
  it('should have an email address input');
  it('should have a recaptcha input');
  it('should have a close button');
  it('should have a "reset password" button');
  
  describe('when the "forgot password" button is clicked', () => {
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