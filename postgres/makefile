#input vars (all optional): name, opts, postgres_pwd, admin_pwd, app_pwd

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
	@docker stop ${name} &> /dev/null || true
	@docker rm ${name} &> /dev/null || true
	@docker build -t flagsql --build-arg postgres_pwd=${postgres_pwd} --build-arg admin_pwd=${admin_pwd} --build-arg app_pwd=${app_pwd} .
	@docker run -d --name ${name} ${opts} flagsql
	@echo "Wating for DB server to come online"
	@until docker exec ${name} psql -U postgres -c "select now()" &> /dev/null; do sleep 1; done
	@sleep 1
	@until docker exec ${name} psql -U postgres -c "select now()" &> /dev/null; do sleep 1; done
	@echo "DB server is online"
