var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var assert = chai.assert;
var webdriver = require('../webdriver');

describe('flags page', () => {

  before(function() {
    this.timeout(9999);
    return page = webdriver.init().url('/');
  });

  it('should have the correct page title', () => {
    page.getTitle()
      .then(title => assert.equal(title, 'flags'));
  });
  
  describe('if not logged in', () => {
    it('should have a login button', () => {
      return page.element('#loginButton');

    });
    it('should have a signup button', () => {
      return page.element('#signupButton');
    });
  });
  
  describe('if logged in', () => {
    before(() => {
      
    });
    
    it('should not have a login button', () => {
      return assert.isRejected(page.element('#loginButton'));
    });
    it('should not have a signup button', () => {
      return assert.isRejected(page.element('#signupButton'));
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
  
  after(() => page.end());
});
