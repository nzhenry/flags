'use strict'

var knex = require('knex');
var fs = require('fs');

var db = knex({
		client: 'pg',
		connection: getConfig()
	});

db.upsert = upsert;

function getConfig() {
	var configFilename = 'db.conf.json';
	// get the config from a file, if the file doesn't exist, write a new file
	if(fs.existsSync(configFilename)) {
		return JSON.parse(fs.readFileSync(configFilename, 'utf-8'));
	} else {
		var config = JSON.stringify({
			host: 'localhost',
			port: 5432,
			database: 'flags',
			user: '',
			password: ''
		});
		fs.writeFile(configFilename, JSON.stringify(config));
		return config;
	}
}

function upsert(tableName, conflictTarget, values) {
  if(!Array.isArray(conflictTarget))
    return upsert(tableName, [conflictTarget], values);
    
  conflictTarget = conflictTarget.map(x=>`"${x}"`).join();
  
  let updates = Object.keys(values)
    .map(key => db.raw('?? = ?', [key, values[key]]).toString())
    .join(", ");

  let insert = db(tableName).insert(values).toString();
  let query = `${insert} ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updates} RETURNING *`;

  return db.raw(query);
};

module.exports = exports = db;
