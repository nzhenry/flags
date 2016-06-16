'use strict'

var fs = require('fs');
var config = require('./config.js');
var knex = require('knex');
var knexfile = require('../knexfile');
var db = knex(knexfile);
var log = require('winston');

module.exports = exports = {
  migrate: migrate,
  seed: seed
}

function migrate() {
  log.info('Updating database schema...');
  return db.migrate.latest();
}

function seed() {
  if(config.seedsDirectory) {
    if(fs.existsSync(config.seedsDirectory)) {
      log.info('Seeding database...');
      return db.seed.run();
    } else {
      log.info("Seeds directory doesn't exist");
    }
  }
}
