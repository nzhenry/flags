var config = require('./lib/config');

module.exports = {
  client: 'pg',
  connection: config.db_admin
};
