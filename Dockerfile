ARG DATABASE_HOST=localhost DATABASE_PORT=27017 DATABASE_NAME=top-contributors HOST=localhost PORT=8080 NODE_ENV=dev USER=node TLS_ENABLED=true CA_PATH='/certificates/do-mongodb-ca-certificate.crt'

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
ARG TLS_ENABLED
ARG CA_PATH

# copy build context and install dependencies
WORKDIR /workspace
COPY . .

# Inject the enviromental variables
ENV DATABASE_HOST=${DATABASE_HOST} DATABASE_PORT=${DATABASE_PORT} DATABASE_NAME=${DATABASE_NAME} PORT=${PORT} HOST=${HOST} NODE_ENV=${NODE_ENV} TLS_ENABLED=${TLS_ENABLED} CA_PATH=${CA_PATH}

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
ARG TLS_ENABLED
ARG CA_PATH

# copy builder output to project workdir
WORKDIR /app
COPY --from=builder  /workspace /app
COPY --from=builder  /workspace/node_modules /app/node_modules
COPY --from=builder  /workspace/package.json /app/

# Inject the enviromental variables
ENV DATABASE_HOST=${DATABASE_HOST} DATABASE_PORT=${DATABASE_PORT} DATABASE_NAME=${DATABASE_NAME} PORT=${PORT} HOST=${HOST} NODE_ENV=${NODE_ENV} TLS_ENABLED=${TLS_ENABLED} CA_PATH=${CA_PATH}

# set user context
# USER ${USER}

EXPOSE ${PORT}

CMD [ "npm", "run", "start" ]