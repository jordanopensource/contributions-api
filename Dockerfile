ARG DATABASE_HOST=localhost DATABASE_PORT=27017 DATABASE_NAME=top-contributors HOST=localhost PORT=8080 NODE_ENV=dev USER=node

###########
# BUILDER #
###########
FROM node:16-alpine3.14 AS builder

# pass the global args
ARG DATABASE_HOST
ARG DATABASE_PORT
ARG DATABASE_NAME
ARG PORT
ARG HOST
ARG NODE_ENV

# copy build context and install dependencies
WORKDIR /workspace
COPY . .

# Inject the enviromental variables
ENV DATABASE_HOST=${DATABASE_HOST} DATABASE_PORT=${DATABASE_PORT} DATABASE_NAME=${DATABASE_NAME} PORT=${PORT} HOST=${HOST} NODE_ENV=${NODE_ENV}

RUN npm install

###########
# PROJECT #
###########
FROM node:16-slim

# pass the global args
ARG DATABASE_HOST
ARG DATABASE_PORT
ARG DATABASE_NAME
ARG PORT
ARG HOST
ARG NODE_ENV
ARG USER

# copy builder output to project workdir
WORKDIR /app
COPY --from=builder --chown=${USER}:${USER} /workspace /app
COPY --from=builder --chown=${USER}:${USER} /workspace/package.json /app/

# Inject the enviromental variables
ENV DATABASE_HOST=${DATABASE_HOST} DATABASE_PORT=${DATABASE_PORT} DATABASE_NAME=${DATABASE_NAME} PORT=${PORT} HOST=${HOST} NODE_ENV=${NODE_ENV}

EXPOSE ${PORT}

CMD [ "npm", "run", "start" ]