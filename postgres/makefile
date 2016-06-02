#input vars (all optional): name, opts, postgres_pwd, admin_pwd, app_pwd

dev: name ?= flagsql
test: name ?= flagsql-test
prod: name ?= flagsql

dev: opts ?= -p 5432:5432
prod: opts ?= -v ~/docker-volumes/${name}/data:/var/lib/postgresql/data --restart always

default: test
dev: start
test: start
prod: start

start:
	@docker stop ${name} 2> /dev/null || true
	@docker rm ${name} 2> /dev/null || true
	docker build -t ${name}-img --build-arg postgres_pwd=${postgres_pwd} --build-arg admin_pwd=${admin_pwd} --build-arg app_pwd=${app_pwd} .
	docker run -d --name ${name} ${opts} ${name}-img
	@sh waitUntilReady ${name} 2> /dev/null
