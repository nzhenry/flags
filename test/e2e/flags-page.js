var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
var assert = chai.assert;
var webdriver = require('../webdriver');
var uuid = require('node-uuid');

chai.use(chaiAsPromised);

describe('flags page', function() {
  this.timeout(9999);

  before(function() {
    return page = webdriver.init('/');
  });
  
  after(() => page.end());

  it('should have the correct page title', () => {
    page.getTitle()
      .then(title => assert.equal(title, 'flags'));
  });
  
  describe('if not logged in', () => {
    it('should not have a logout button', () => {
      return assert.eventually.isFalse(page.isVisible('#logoutButton'));
    });
    it('should have a login button', () => {
      return assert.eventually.isTrue(page.isVisible('#loginButton'));
    });
    it('should have a signup button', () => {
      return assert.eventually.isTrue(page.isVisible('#signupButton'));
    });
  });
  
  describe('if logged in', () => {
    before(function() {
      return page.click('#signupButton')
        .then(()=> page.waitForVisible('#emailInput'))
        .then(()=> page.setValue('#emailInput',`${uuid.v4()}@test`))
        .then(()=> page.setValue('#passwordInput','foobar'))
        .then(f => page.frame(0))
        .then(()=> page.click('#recaptcha-anchor'))
        .then(()=> page.waitForExist('#recaptcha-anchor.recaptcha-checkbox-checked'))
        .then(f => page.frameParent())
        .then(()=> page.click('#signupSubmit'))
        .then(()=> page.waitForInvisible('#loginButton'));
    });
    
    it('should have a logout button', () => {
      return assert.eventually.isTrue(page.isVisible('#logoutButton'));
    });
    it('should not have a login button', () => {
      return assert.eventually.isFalse(page.isVisible('#loginButton'));
    });
    it('should not have a signup button', () => {
      return assert.eventually.isFalse(page.isVisible('#signupButton'));
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
  
  describe('flag', () => {
    it("should link to the flag's details page");
    it('should show the flag image');
    it('should show the title');
    it("should show the author's name");
    it('should have an "Add to my collection" button');
    
    describe('when the "Add to my collection" button is clicked', () => {
      describe('if logged in', () => {
        it('should show the "Add to my collection" popup');
      });
      
      describe('if not logged in', () => {
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
