var config = require('../lib/config');

var options = {
	desiredCapabilities: {
	browserName: 'firefox'
// 	browserName: 'chrome'
// 	browserName: 'phantomjs', 'phantomjs.page.settings.userAgent': ''
},
	host: config.seleniumHost,
	baseUrl: config.site,
	waitforTimeout: 9999
};
module.exports = exports = require('webdriverio').remote(options);
var init = exports.init;
exports.init = function(url) {
  var page = init.apply(this, arguments).url(url);
  page.waitForInvisible = function (sel,ms) {
    return page.waitForVisible(sel,ms,true)
  }
  return page;
}
