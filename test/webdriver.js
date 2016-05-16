var config = require('../lib/config');

var options = {
	desiredCapabilities: { browserName: 'firefox' },
	host: config.seleniumHost,
	baseUrl: config.site
};
module.exports = exports = require('webdriverio').remote(options);
