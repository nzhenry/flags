FROM node:6.1.0

RUN useradd -ms /bin/bash myuser
USER myuser
RUN mkdir -p /home/myuser/app
WORKDIR /home/myuser/app

COPY package.json /home/myuser/app/
RUN npm install
COPY bower.json /home/myuser/app/
RUN ./node_modules/.bin/bower install
COPY . /home/myuser/app

CMD [ "npm", "start" ]

EXPOSE 3000
