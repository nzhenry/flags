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
	@docker stop flags-fakemail; docker rm flags-fakemail || true
	@docker stop flags-test; docker rm flags-test || true
	@docker stop flags-tmp; docker rm flags-tmp || true
	@docker stop flagsql-test; docker rm flagsql-test || true
	@docker stop flags-selenium-firefox; docker rm flags-selenium-firefox || true
build-image:
	@echo
	@echo Building new docker image
	@rm -rf artifacts || true
	docker build -t flags .
run-tests:
	@echo Starting up temporary database container for testing
	cd postgres && $(MAKE) && cd ..
	@echo
	@echo Starting up mock STMP server
	@rm -rf ~/docker-volumes/flags-fakemail
	@cd test/mock-smtp && docker build -t flags-fakemail-img . && cd ../..
	@docker run -d --name flags-fakemail -v ~/docker-volumes/flags-fakemail:/usr/src/app/store flags-fakemail-img
	@echo
	@echo Starting up app container for testing
	docker run -d --name flags-tmp --link flagsql-test --link flags-fakemail -e NODE_ENV=TEST flags
	@echo
	@echo Starting up Selenium standalone server
	docker run -d --name flags-selenium-firefox --link flags-tmp selenium/standalone-firefox
	@echo
	@echo Running tests
	docker run --name flags-test --link flags-selenium-firefox -e NODE_ENV=TEST -v ~/docker-volumes/flags-fakemail:/usr/src/app/fakemail flags bash -c 'npm test'
	@docker cp flags-test:/home/myuser/app/artifacts .
stop-containers:
	@echo
	@echo Stopping test containers
	@docker stop flags-fakemail || true
	@docker stop flags-test || true
	@docker stop flags-tmp || true
	@docker stop flagsql-test || true
	@docker stop flags-selenium-firefox || true
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
