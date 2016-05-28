
exports.up = function(knex, Promise) {
  return flagSearch();
  
  function flagSearch() {
    return knex.raw("\
      CREATE FUNCTION fn_update_flagsearch(flag_id integer) \
      RETURNS VOID AS $$ DECLARE text_value tsvector; BEGIN \
      text_value = (SELECT to_tsvector('english'::regconfig, \
                        coalesce(f.name, '') || ' ' || \
                        coalesce(f.story, '') || ' ' || \
                        coalesce(a.name, '') || ' ' || \
                        coalesce(p.name, '') || ' ' || \
                        coalesce(ft.tags, '')) \
                    FROM flags f \
                    LEFT JOIN authors a ON a.id = f.author \
                    LEFT JOIN places p ON p.id = a.place \
                    LEFT JOIN vw_flagtags ft ON ft.flag = f.id \
                    WHERE f.id = flag_id); \
      INSERT INTO flagsearch (flag, text) VALUES (flag_id, text_value) \
        ON CONFLICT (flag) DO UPDATE SET text = text_value; \
      END; $$ LANGUAGE plpgsql")
      .then(() => knex.raw("ALTER FUNCTION fn_update_flagsearch(integer) OWNER TO flowner"));
  }
};

exports.down = function(knex, Promise) {
  return flagSearch();
  
  function flagSearch() {
    return knex.raw("DROP FUNCTION fn_update_flagsearch(integer)");
  }
};
