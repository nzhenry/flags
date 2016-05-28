'use strict'

var fs = require('fs');
var config = require('./config.js');
var knex = require('knex');
var knexfile = require('../knexfile');
var db = knex(knexfile);

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
