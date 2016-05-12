#input vars (all optional): name, opts, root_pwd, admin_pwd, app_pwd
script_content = $$(cat security.sql)

dev: name ?= flagsql
test: name ?= flagsql-test
prod: name ?= flagsql

dev: opts ?= -p 5432:5432
prod: opts ?= -v ~/postgres/data_volumes/${name}:/var/lib/postgresql/data

default: test
dev: start
test: start
prod: start

start:
	@docker run -d --name ${name} -e POSTGRES_PASSWORD=${root_pwd} ${opts} postgres
	@sh waitForServerStartup.sh ${name}
	@echo Creating flags database
	@docker exec ${name} psql -U postgres -c "$$(cat db.sql)" > /dev/null
	@echo done
	@echo Securing flags database
	@docker exec ${name} bash -c "echo \"${script_content}\" > script.sql"
	@docker exec ${name} psql -U postgres -d flags -f script.sql -v admin_pwd="'${admin_pwd}'" -v app_pwd="'${app_pwd}'" > /dev/null
	@echo done
