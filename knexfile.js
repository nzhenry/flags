var config = require('./lib/config');

module.exports = {
  client: 'pg',
  connection: config.db_admin,
  migrations: {
    directory: 'postgres/migrations'
  },
  seeds: {
    directory: config.seedsDirectory
  }
};
