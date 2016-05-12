CREATE ROLE flowner;
CREATE USER flags_admin WITH PASSWORD :admin_pwd;
GRANT flowner TO flags_admin;

CREATE ROLE fluser;
CREATE USER flags_app WITH PASSWORD :app_pwd;
GRANT fluser TO flags_app;

ALTER DATABASE flags OWNER TO flowner;
ALTER SCHEMA public OWNER TO flowner;
