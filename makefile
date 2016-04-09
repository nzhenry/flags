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
	@docker rm starter-test || true
	@docker rm starter-tmp || true
	@docker rm starter-selenium-firefox || true
build-image:
	@echo
	@echo Building new docker image
	@rm -rf artifacts || true
	docker build -t starter .
run-tests:
	@echo
	@echo Starting up app container for testing
	docker run -d --name starter-tmp starter
	@echo
	@echo Starting up Selenium standalone server
	docker run -d --name starter-selenium-firefox --link starter-tmp selenium/standalone-firefox
	@echo
	@echo Starting up test harness
	docker run -dit --name starter-test --link starter-selenium-firefox starter bash
	@echo
	@echo Running tests
	@docker exec starter-test npm test || true
	@docker cp starter-test:/usr/src/app/artifacts . || true
stop-containers:
	@echo
	@echo Stopping test containers
	@docker stop starter-test || true
	@docker exec starter-tmp bash -c 'kill $$(pidof gulp)' || true
	@docker stop starter-selenium-firefox || true
deploy:
	@echo
	@echo Deploying app
	@docker exec starter bash -c 'kill $$(pidof gulp)' || true
	@sleep 1
	@docker rm starter || true
	docker run -d --name starter -e VIRTUAL_HOST=starter.livehen.com -e VIRTUAL_PORT=3000 starter
deploy-dev:
	@echo
	@echo Deploying app
	@docker exec starter bash -c 'kill $$(pidof gulp)' || true
	@sleep 1
	@docker rm starter || true
	docker run -d --name starter -p 3000:3000 starter

