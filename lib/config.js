var fs = require('fs');

module.exports = exports = getConfig();

function getConfig() {
  console.log(process.env.NODE_ENV);
  var env = process.env.NODE_ENV
    ? process.env.NODE_ENV
    : 'DEV';
	var configFilename = `config.${env}.json`;
	// get the config from a file, if the file doesn't exist,
	// write a new template file and throw an exception
	if(fs.existsSync(configFilename)) {
		return JSON.parse(fs.readFileSync(configFilename, 'utf-8'));
	} else {
	  fs.writeFileSync(configFilename, fs.readFileSync('config.json', 'utf-8'));
		throw new Error("Please fill out missing fields in " + configFilename + " file");
	}
}
