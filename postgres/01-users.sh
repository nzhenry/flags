if [ -f /var/postgres/passwords/admin_pwd ]
  then psql -U postgres -c "CREATE USER flags_admin WITH PASSWORD '$(cat /var/postgres/passwords/admin_pwd)'"
  else psql -U postgres -c "CREATE USER flags_admin"
fi

if [ -f /var/postgres/passwords/app_pwd ]
  then psql -U postgres -c "CREATE USER flags_app WITH PASSWORD '$(cat /var/postgres/passwords/app_pwd)'"
  else psql -U postgres -c "CREATE USER flags_app"
fi

rm -rf /var/postgres/passwords
