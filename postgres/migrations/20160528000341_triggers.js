
exports.up = function(knex, Promise) {
  return triggerFunctions()
    .then(triggers);
  
  function triggerFunctions() {
    return flagSearch_flag()
      .then(flagSearch_author)
      .then(flagSearch_place)
      .then(flagSearch_flagtag)
      .then(flagSearch_tag);
    
    function flagSearch_flag() {
      return knex.raw("\
        CREATE FUNCTION tf_flag_search_flag() RETURNS TRIGGER AS $$ BEGIN \
          PERFORM fn_update_flagsearch(new.id); \
          RETURN new; \
        END; $$ LANGUAGE plpgsql")
        .then(() => knex.raw("ALTER FUNCTION tf_flag_search_flag() OWNER TO flowner"));
    }
    
    function flagSearch_author() {
      return knex.raw("\
        CREATE FUNCTION tf_flag_search_author() RETURNS TRIGGER AS $$ BEGIN \
          PERFORM fn_update_flagsearch(f.id) \
          from authors a \
          inner join flags f on f.author = a.id \
          where a.id = new.id; \
          RETURN new; \
        END; $$ LANGUAGE plpgsql")
        .then(() => knex.raw("ALTER FUNCTION tf_flag_search_author() OWNER TO flowner"));
    }
    
    function flagSearch_place() {
      return knex.raw("\
        CREATE FUNCTION tf_flag_search_place() RETURNS TRIGGER AS $$ BEGIN \
          PERFORM fn_update_flagsearch(f.id) \
          from places p \
          inner join authors a on a.place = p.id \
          inner join flags f on f.author = a.id \
          where p.id = new.id; \
          RETURN new; \
        END; $$ LANGUAGE plpgsql")
        .then(() => knex.raw("ALTER FUNCTION tf_flag_search_place() OWNER TO flowner"));
    }
    
    function flagSearch_flagtag() {
      return knex.raw("\
        CREATE FUNCTION tf_flag_search_flagtag() RETURNS TRIGGER AS $$ BEGIN \
          PERFORM fn_update_flagsearch(f.id) \
          from flagtags ft \
          inner join flags f on f.id = ft.flag \
          where ft.flag = new.flag and ft.tag = new.tag; \
          RETURN new; \
        END; $$ LANGUAGE plpgsql")
        .then(() => knex.raw("ALTER FUNCTION tf_flag_search_flagtag() OWNER TO flowner"));
    }
    
    function flagSearch_tag() {
      return knex.raw("\
        CREATE FUNCTION tf_flag_search_tag() RETURNS TRIGGER AS $$ BEGIN \
          PERFORM fn_update_flagsearch(f.id) \
          from tags t \
          inner join flagtags ft on ft.tag = t.id \
          inner join flags f on f.id = ft.flag \
          where t.tag = new.id; \
          RETURN new; \
        END; $$ LANGUAGE plpgsql")
        .then(() => knex.raw("ALTER FUNCTION tf_flag_search_tag() OWNER TO flowner"));
    }
  }
  
  function triggers() {
    return flagInsert()
      .then(flagUpdate)
      .then(authorUpdate)
      .then(placeUpdate)
      .then(tagUpdate)
      .then(flagtagUpdate)
      .then(flagtagInsert);
      
    function flagInsert() {
      return knex.raw("CREATE TRIGGER tr_flag_insert \
        AFTER INSERT ON flags FOR EACH ROW \
        EXECUTE PROCEDURE tf_flag_search_flag()");
    }
    
    function flagUpdate() {
      return knex.raw("CREATE TRIGGER tr_flag_update \
        AFTER UPDATE ON flags FOR EACH ROW \
        WHEN ((old.author || coalesce(old.name,'') || coalesce(old.story,'')) \
        IS DISTINCT FROM (new.author || coalesce(new.name,'') || coalesce(new.story,''))) \
        EXECUTE PROCEDURE tf_flag_search_flag()");
    }
    
    function authorUpdate() {
      return knex.raw("CREATE TRIGGER tr_author_update \
        AFTER UPDATE ON authors FOR EACH ROW \
        WHEN ((old.place || coalesce(old.name,'')) \
        IS DISTINCT FROM (new.place || coalesce(new.name,''))) \
        EXECUTE PROCEDURE tf_flag_search_author()");
    }
    
    function placeUpdate() {
      return knex.raw("CREATE TRIGGER tr_place_update \
        AFTER UPDATE ON places FOR EACH ROW \
        WHEN (old.name IS DISTINCT FROM new.name) \
        EXECUTE PROCEDURE tf_flag_search_place()");
    }
    
    function tagUpdate() {
      return knex.raw("CREATE TRIGGER tr_tag_update \
        AFTER UPDATE ON tags FOR EACH ROW \
        WHEN (old.name IS DISTINCT FROM new.name) \
        EXECUTE PROCEDURE tf_flag_search_tag()");
    }
    
    function flagtagUpdate() {
      return knex.raw("CREATE TRIGGER tr_flagtag_update \
        AFTER UPDATE ON flagtags FOR EACH ROW \
        WHEN ((old.flag || ' ' || old.tag) \
        IS DISTINCT FROM (new.flag || ' ' || new.tag)) \
        EXECUTE PROCEDURE tf_flag_search_flagtag()");
    }
    
    function flagtagInsert() {
      return knex.raw("CREATE TRIGGER tr_flagtag_insert \
        AFTER INSERT ON flagtags FOR EACH ROW \
        EXECUTE PROCEDURE tf_flag_search_flagtag()");
    }
  }
};

exports.down = function(knex, Promise) {
  return triggers()
    .then(triggerFunctions);
  
  function triggerFunctions() {
    return flagSearch_flag()
      .then(flagSearch_author)
      .then(flagSearch_place)
      .then(flagSearch_flagtag)
      .then(flagSearch_tag);
  
    function flagSearch_flag() {
      return knex.raw("DROP FUNCTION tf_flag_search_flag()");
    }
  
    function flagSearch_author() {
      return knex.raw("DROP FUNCTION tf_flag_search_author()");
    }
  
    function flagSearch_place() {
      return knex.raw("DROP FUNCTION tf_flag_search_place()");
    }
  
    function flagSearch_flagtag() {
      return knex.raw("DROP FUNCTION tf_flag_search_flagtag()");
    }
  
    function flagSearch_tag() {
      return knex.raw("DROP FUNCTION tf_flag_search_tag()");
    }
  }
  
  function triggers() {
    return flagInsert()
      .then(flagUpdate)
      .then(authorUpdate)
      .then(placeUpdate)
      .then(tagUpdate)
      .then(flagtagUpdate)
      .then(flagtagInsert);
  
    function flagInsert() {
      return knex.raw("DROP TRIGGER tr_flag_insert ON flags");
    }
    
    function flagUpdate() {
      return knex.raw("DROP TRIGGER tr_flag_update ON flags");
    }
    
    function authorUpdate() {
      return knex.raw("DROP TRIGGER tr_author_update ON authors");
    }
    
    function placeUpdate() {
      return knex.raw("DROP TRIGGER tr_place_update ON places");
    }
    
    function tagUpdate() {
      return knex.raw("DROP TRIGGER tr_tag_update ON tags");
    }
    
    function flagtagUpdate() {
      return knex.raw("DROP TRIGGER tr_flagtag_update ON flagtags");
    }
    
    function flagtagInsert() {
      return knex.raw("DROP TRIGGER tr_flagtag_insert ON flagtags");
    }
  }
};
