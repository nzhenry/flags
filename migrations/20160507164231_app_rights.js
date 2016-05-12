
exports.up = function(knex, Promise) {
  return knex.raw(" \
    REVOKE CREATE ON SCHEMA public FROM public; \
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO fluser; \
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, UPDATE ON SEQUENCES TO fluser \
  ");
};

exports.down = function(knex, Promise) {
  return knex.raw(" \
    GRANT CREATE ON SCHEMA public TO public; \
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE ON TABLES FROM fluser; \
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, UPDATE ON SEQUENCES FROM fluser \
  ");
};
