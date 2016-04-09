var assert = require('assert');
var webdriver = require('../webdriver');

describe('Main App', function() {

	before(function() {
		this.timeout(9999);
		return page = webdriver.init().url('/');
	});
	
  it('should have the correct page title', function() {
  	return page.getTitle().then(function(title) {
  		assert.equal(title, 'Express');
  	});
  });
  
  after(function() {
  	return page.end();
  });
});
