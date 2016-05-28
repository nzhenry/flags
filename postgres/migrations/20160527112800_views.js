
exports.up = function(knex, Promise) {
  return flagtags();

  function createView(name, select) {
    return knex.raw("CREATE VIEW " + name + ' AS ' + select)
      .then(() => knex.raw("ALTER TABLE " + name + " OWNER TO flowner"));
  }
  
  function flagtags() {
    return createView("vw_flagtags", "\
      SELECT f.id AS flag, \
        string_agg(t.name, ' '::text) AS tags \
      FROM flags f \
      JOIN flagtags ft ON ft.flag = f.id \
      JOIN tags t ON t.id = ft.tag \
      GROUP BY f.id");
  }
};

exports.down = function(knex, Promise) {
  return dropView('vw_flagtags');
  
  function dropView(name) {
    return knex.raw('DROP VIEW ' + name);
  }
  
  function flagtags() {
    return dropView("vw_flagtags");
  }
};
