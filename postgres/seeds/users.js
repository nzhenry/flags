exports.seed = function(knex, Promise) {
  console.log('Deleting all users');
  return knex('users').del()
    .then(function() {
      console.log('Done. Inserting test user');
      return knex('users').insert({email: 'testuser@e2e-test', authtype: 'local', token: 'foobar'});
    });
};
