FROM node:16-alpine3.14

COPY package*.json /tmp/
RUN cd /tmp && npm install

WORKDIR /app

COPY . .

RUN mv /tmp/node_modules .

ENV DATABASE_HOST  localhost
ENV DATABASE_PORT  27017
ENV DATABASE_NAME top-contributors
# ENV DATABASE_USER 
# ENV DATABASE_PASSWORD 
ENV HOST localhost
ENV PORT 8080
ENV NODE_ENV dev

EXPOSE 8080

CMD [ "npm", "run", "start" ]