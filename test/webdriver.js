var options = {
	desiredCapabilities: { browserName: 'firefox' },
	host: 'flags-selenium-firefox',
	baseUrl: 'http://flags-tmp:3000'
// 	baseUrl: 'http://localhost:3000'
};
module.exports = exports = require('webdriverio').remote(options);
