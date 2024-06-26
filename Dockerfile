FROM node:10-slim

WORKDIR /server

COPY . /server
RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]