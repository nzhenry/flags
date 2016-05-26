'use strict'

var fs = require('fs');
var config = require('./config.js');
var knex = require('knex');
var db = knex({
  client: 'pg',
  connection: config.db_admin,
  migrations: {
    directory: 'postgres/migrations'
  },
  seeds: {
    directory: config.seedsDirectory
  }
});

module.exports = exports = {
  migrate: migrate,
  seed: seed
}

function migrate() {
  console.log('Updating database schema...');
  return db.migrate.latest();
}

function seed() {
  if(config.seedsDirectory) {
    if(fs.existsSync(config.seedsDirectory)) {
      console.log('Seeding database...');
      return db.seed.run();
    } else {
      console.log("Seeds directory doesn't exist");
    }
  }
}
