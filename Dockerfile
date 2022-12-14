FROM node:14

MAINTAINER keith.dh@hotmail.com

EXPOSE 3000

WORKDIR /home/node/app

COPY ./ /home/node/app

RUN npm config set registry https://registry.npmmirror.com
RUN npm install

CMD node src/server.js
