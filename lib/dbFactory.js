exports.get = function(args) {
  return require('knex')(args)
}
