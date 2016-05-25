var chai = require("chai");
var assert = chai.assert;
var uuid = require('node-uuid');

describe('flags page', function() {
  beforeEach(function() {
    browser.deleteCookie();
    browser.url('/');
  });
  
  it('should have the correct page title');//, function() {
//     assert.equal(browser.getTitle(), 'flags');
//   });
  
  describe('if not logged in', function() {
    it('should not have a logout button', () => {
      assert.isFalse(browser.isVisible('#logoutButton'));
    });
    it('should have a login button', () => {
      assert.isTrue(browser.isVisible('#loginButton'));
    });
    it('should have a signup button', () => {
      assert.isTrue(browser.isVisible('#signupButton'));
    });
  });
  
  describe('if logged in', function() {
    beforeEach(function() {
      browser.click('#signupButton');
      browser.waitForVisible('#emailInput');
      browser.setValue('#emailInput',`${uuid.v4()}@test`);
      browser.setValue('#passwordInput','foobar');
      browser.frame(0);
      browser.click('#recaptcha-anchor');
      browser.waitForExist('#recaptcha-anchor.recaptcha-checkbox-checked');
      browser.frame();
      browser.click('#signupSubmit');
      browser.waitForVisible('#loginButton', null, true);
    });
    
    it('should have a logout button', () => {
      assert.isTrue(browser.isVisible('#logoutButton'));
    });
    it('should not have a login button', () => {
      assert.isFalse(browser.isVisible('#loginButton'));
    });
    it('should not have a signup button', function() {
      assert.isFalse(browser.isVisible('#signupButton'));
    });
    it("should show the user's email address");
    it('should have a logout button');
  });

  it('should show the number of flags');
  it('should show a list of flags');
  it('should show a filter description');
  it('should have a keyword filter textbox');
  it('should have a location filter dropdown');
  it('should have a tags filter dropdown');
  it('should have a "sort by" dropdown');
  it('should have a "clear filters" button');
  
  describe('flag', function() {
    it("should link to the flag's details page");
    it('should show the flag image');
    it('should show the title');
    it("should show the author's name");
    it('should have an "Add to my collection" button');
    
    describe('when the "Add to my collection" button is clicked', function() {
//       describe('if logged in', function() {
//         it('should show the "Add to my collection" popup');
//       });
      
      describe('if not logged in', function() {
        it('should show the onramp popup');
      });
    });
  });
  
  describe('"sort by" dropdown', () => {
    it('should have a "title" option');
    it('should have a "designer" option');
    it('should have a "popularity" option');
    it('should have a "my preference" option');
  });
  
  describe('when a keyword filter is entered', () => {
    it('should only show the flags which have fields containing the keyword(s)');
  });
  
  describe('when a location filter is selected', () => {
    it('should only show the flags with authors from the selected location');
  });
  
  describe('when a tag filter is selected', () => {
    it('should only show the flags with the seleted tag');
  });
  
  describe('when the filters are cleared', () => {
    it('should go back to showing all the flags');
  });
  
  describe('when the user scrolls to the bottom of the page', () => {
    it('should load more flags');
  });
  
});
