CREATE ROLE flowner;
GRANT flowner TO flags_admin;

CREATE ROLE fluser;
GRANT fluser TO flags_app;

ALTER DATABASE flags OWNER TO flowner;
ALTER SCHEMA public OWNER TO flowner;
