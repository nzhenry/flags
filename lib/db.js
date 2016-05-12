'use strict'

var config = require('./config.js');
var knex = require('knex');
var db = knex({
  client: 'pg',
  connection: config.db
});

db.upsert = upsert;

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
