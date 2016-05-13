ci: remove-unused-images remove-containers build-image run-tests stop-containers

cd: ci deploy

dev: build-image deploy-dev

remove-unused-images:
	@echo
	@echo Removing all unused docker images
	@docker rmi $$(docker images -q --filter 'dangling=true') 2> /dev/null || true
remove-containers:
	@echo
	@echo Removing old docker containers
	@docker rm flags-test || true
	@docker rm flags-tmp || true
	@docker rm flagsql-test || true
	@docker rm flags-selenium-firefox || true
build-image:
	@echo
	@echo Building new docker image
	@rm -rf artifacts || true
	docker build -t flags .
run-tests:
	$(MAKE) stop-containers
	@echo Starting up temporary database container for testing
	cd postgres && $(MAKE) && cd ..
	@echo
	@echo Starting up app container for testing
	docker run -d --name flags-tmp --link flagsql-test -e NODE_ENV=TEST flags
	@echo
	@echo Starting up Selenium standalone server
	docker run -d --name flags-selenium-firefox --link flags-tmp selenium/standalone-firefox
	@echo
	@echo Starting up test harness
	docker run -dit --name flags-test --link flags-selenium-firefox -e NODE_ENV=TEST flags bash
	@echo
	@echo Running tests
	@docker exec flags-test npm test || true
	@docker cp flags-test:/home/myuser/app/artifacts . || true
stop-containers:
	@echo
	@echo Stopping test containers
	@docker stop flags-test 2> /dev/null || true
	@docker stop flags-tmp 2> /dev/null || true
	@docker stop flagsql-test 2> /dev/null || true
	@docker stop flags-selenium-firefox 2> /dev/null || true
deploy:
	@echo
	@echo Deploying app
	@docker stop flags || true
	@docker rm flags || true
	docker run -d --name flags --link flagsql -e NODE_ENV=PROD -e VIRTUAL_HOST=flags.livehen.com -e VIRTUAL_PORT=3000 flags
deploy-dev:
	@echo
	@echo Deploying app
	@docker stop flags || true
	@docker rm flags || true
	docker run --name flags --link flagsql -p 3000:3000 flags
