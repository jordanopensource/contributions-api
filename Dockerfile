FROM node:17-alpine3.12

WORKDIR /app
COPY package*.json /tmp/

RUN cd /tmp && npm install && cp -r node_modules/ /app

COPY . .

# ENV DB_URL mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false

# ENV PORT 8080
EXPOSE 8080

CMD [ "node", "server.js" ]