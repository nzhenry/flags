FROM node:6.1.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
COPY bower.json /usr/src/app/
RUN ./node_modules/.bin/bower install --allow-root
COPY . /usr/src/app

CMD [ "npm", "start" ]

EXPOSE 3000
