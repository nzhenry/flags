
exports.up = function(knex, Promise) {
  return users()
    .then(places)
    .then(authors)
    .then(flags)
    .then(flagsearch)
    .then(tags)
    .then(flagtags);

  function createTable(name, func) {
    return knex.schema.createTable(name, func)
      .then(() => knex.raw("ALTER TABLE " + name + " OWNER TO flowner"));
  }

  function users() {
    return createTable('users', function (table) {
      table.increments();
      table.text('email').unique().notNullable();
      table.text('authtype').notNullable();
      table.text('token').notNullable();
      table.text('pwd_reset_key');
      table.timestamps();
    });
  }

  function places() {
    return createTable('places', function (table) {
      table.increments();
      table.text('name').unique().notNullable();
    });
  }

  function authors() {
    return createTable('authors', function (table) {
      table.increments();
      table.text('name');
      table.integer('place').references('id').inTable('places');
      table.unique(['name','place']);
    });
  }

  function flags() {
    return createTable('flags', function (table) {
      table.increments();
      table.text('name');
      table.integer('author').references('id').inTable('authors');
      table.text('story');
      table.text('filename').unique().notNullable();
    });
  }

  function flagsearch() {
    return createTable('flagsearch', function (table) {
      table.integer('flag').unique().references('id').inTable('flags');
      table.specificType('text', 'tsvector');
    }).then(() => knex.raw('CREATE INDEX flagsearch_idx ON flagsearch USING gin(text)'));
  }

  function tags() {
    return createTable('tags', function (table) {
      table.increments();
      table.text('name').unique().notNullable();
    });
  }

  function flagtags() {
    return createTable('flagtags', function (table) {
      table.primary(['flag', 'tag']);
      table.integer('flag').notNullable().references('id').inTable('flags');
      table.integer('tag').notNullable().references('id').inTable('tags');
    });
  }
};

exports.down = function(knex, Promise) {
  return dropTable('flagtags')()
    .then(dropTable('tags'))
    .then(dropTable('flagsearch'))
    .then(dropTable('flags'))
    .then(dropTable('authors'))
    .then(dropTable('places'))
    .then(dropTable('users'));
  
  function dropTable(name) {
    return () => knex.schema.dropTable(name);
  }
};
