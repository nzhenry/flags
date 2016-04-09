var options = {
	desiredCapabilities: { browserName: 'firefox' },
	host: 'starter-selenium-firefox',
	baseUrl: 'http://starter-tmp:3000'
	//baseUrl: 'http://localhost:3000'
};
module.exports = exports = require('webdriverio').remote(options);