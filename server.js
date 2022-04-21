import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";

import usersRoute from "./routes/Users.js";
import organizationsRoute from "./routes/Organizations.js";
import contributionsRoute from "./routes/Contributions.js";
import healthCheckRoute from "./routes/Health.js";

import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

/* Loading the environment variables from the config.env file. */
dotenv.config({
  path: "./config.env",
});

/* Creating an instance of the express application. */
const app = express();
/* Those are middleware, that will be executed before the request is handled by the route. */
/* A middleware that will parse the request body and make it available in the request object. */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/* A middleware that will remove the X-Powered-By header from the response. */
app.use(helmet.hidePoweredBy());
/* A middleware that will compress the response body. */
app.use(compression());
/* A middleware that will allow the server to accept requests from other origins. */
app.use(cors());
/* Getting the port from the environment variables. */
const port = process.env.PORT;

/* check if the environment is not production, if it is not
production then it will load the swagger documentation. */
if (process.env.NODE_ENV !== "production") {
  /* Defining the options for the swagger documentation. */
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "JOSA Top Contributors API",
        version: "1.0.0",
        description: "Express based APIs for the JOSA Top Contributors.",
      },
      servers: [{ url: `http://${process.env.HOST}:${process.env.PORT}` }],
    },
    apis: ["./routes/*.js"],
  };
  /* Creating a swagger specification object that will be used by the swagger-ui-express package. */
  const swaggerSpecs = swaggerJsDoc(options);
  /* Using the swagger-ui-express package to serve the swagger documentation. */
  app.use("/v1/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));
}

/* check if the environment is not production, if it is not
production then it will change the logging verbosity. */
if (process.env.LOGGING === "dev") {
  app.use(morgan("combined"));
} else if (process.env.LOGGING === "tiny") {
  app.use(morgan("tiny"));
}

/**
 * Connect to the database using the URL stored in the DB_URL environment variable
 */
const ConnectToDB = async () => {
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.info("Connected to the database");
  console.info(
    `Database Host: ${mongoose.connection.host}\nDatabase Port: ${mongoose.connection.port}\nDatabase Name: ${mongoose.connection.name}`
  );
};

/* Importing the routes from the routes folder and using them in the app. */
app.use("/v1", usersRoute);
app.use("/v1", organizationsRoute);
app.use("/v1", contributionsRoute);
app.use("/v1", healthCheckRoute);

/* This is a route that will be triggered when the user tries to access a resource that is not
available. */
app.get("*", (req, res) => {
  let message =
    "Resource not found, please go to /v1/docs to see all the available routes and resources.";
  /* Checking if the environment is production, if it is production then it will change the message
  that will be sent to the user. */
  if (process.env.NODE_ENV === "production") {
    message = "Resource not found, check your connection and try again.";
  }
  /* Sending a response to the user with a status code of 404 and a message. */
  res.status(404).json({
    message: message,
  });
});

/* This is the main function of the app, it will start the server and connect to the database. */
app.listen(port, async () => {
  console.log(`Express server listening on port: ${port}`);
  await ConnectToDB();
});

/* This is a listener for the uncaughtException event, it will be triggered when an exception is thrown
and not caught. */
process.on("uncaughtException", async err => {
  console.error(
    `There is an error server can't continue running, "THE ERROR": ${err}`
  );
  /* Disconnecting the database connection. */
  mongoose.disconnect(() => {
    console.log("Database disconnected");
  });
  console.log("server is closed");
  /* A way to exit the process, it will exit the process with a failure code. */
  process.exit(1);
});
