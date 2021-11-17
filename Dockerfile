FROM node:17-alpine3.12

WORKDIR /app
COPY package*.json /tmp/

RUN cd /tmp && npm install && cp -r node_modules/ /app

COPY . .

ENV DB_URL mongodb://localhost:27017
ENV HOST localhost
ENV PORT 8080
ENV NODE_ENV dev

EXPOSE 8080

CMD [ "npm", "run", "dev" ]