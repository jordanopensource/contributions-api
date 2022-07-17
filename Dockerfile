FROM node:16-alpine3.14

COPY package*.json /tmp/
RUN cd /tmp && npm install

WORKDIR /app

COPY . .

RUN mv /tmp/node_modules .

ENV DB_URL mongodb://localhost:27017
ENV HOST localhost
ENV PORT 8080
ENV NODE_ENV dev

EXPOSE 8080

CMD [ "npm", "run", "start" ]