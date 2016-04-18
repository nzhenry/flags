ci: remove-unused-images remove-containers build-image run-tests stop-containers

cd: ci deploy

cd-dev: ci deploy-dev

remove-unused-images:
	@echo
	@echo Removing all unused docker images
	@docker rmi $$(docker images -q --filter 'dangling=true') || true
remove-containers:
	@echo
	@echo Removing old docker containers
	@docker rm flags-test || true
	@docker rm flags-tmp || true
	@docker rm flags-selenium-firefox || true
build-image:
	@echo
	@echo Building new docker image
	@rm -rf artifacts || true
	docker build -t flags .
run-tests:
	@echo
	@echo Starting up app container for testing
	docker run -d --name flags-tmp flags
	@echo
	@echo Starting up Selenium standalone server
	docker run -d --name flags-selenium-firefox --link flags-tmp selenium/standalone-firefox
	@echo
	@echo Starting up test harness
	docker run -dit --name flags-test --link flags-selenium-firefox flags bash
	@echo
	@echo Running tests
	@docker exec flags-test npm test || true
	@docker cp flags-test:/usr/src/app/artifacts . || true
stop-containers:
	@echo
	@echo Stopping test containers
	@docker stop flags-test || true
	@docker exec flags-tmp bash -c 'kill $$(pidof gulp)' || true
	@docker stop flags-selenium-firefox || true
deploy:
	@echo
	@echo Deploying app
	@docker exec flags bash -c 'kill $$(pidof gulp)' || true
	@sleep 1
	@docker rm flags || true
	docker run -d --name flags -e VIRTUAL_HOST=flags.livehen.com -e VIRTUAL_PORT=3000 flags
deploy-dev:
	@echo
	@echo Deploying app
	@docker exec flags bash -c 'kill $$(pidof gulp)' || true
	@sleep 1
	@docker rm flags || true
	docker run -d --name flags -p 3000:3000 flags

