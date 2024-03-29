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

dotenv.config({
  path: "./config.env",
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet.hidePoweredBy());
app.use(compression());
app.use(cors());
const port = process.env.PORT;

if (process.env.NODE_ENV !== "production") {
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
  const swaggerSpecs = swaggerJsDoc(options);
  app.use("/v1/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));
}
if (process.env.LOGGING === "dev") {
  app.use(morgan("combined"));
} else if (process.env.LOGGING === "tiny") {
  app.use(morgan("tiny"));
}

const ConnectToDB = async () => {
  let DB_URL =
    "mongodb://" +
    process.env.DATABASE_HOST +
    ":" +
    process.env.DATABASE_PORT +
    "/" +
    process.env.DATABASE_NAME;
  if (process.env.NODE_ENV !== "dev") {
    // DB_URL
    // mongodb://username:password@host:port/database
    DB_URL =
      "mongodb+srv://" +
      process.env.DATABASE_USER +
      ":" +
      process.env.DATABASE_PASSWORD +
      "@" +
      process.env.DATABASE_HOST +
      "/" +
      process.env.DATABASE_NAME +
      "?authSource=admin&tls=" +
      process.env.TLS_ENABLED +
      "&tlsCAFile=" +
      process.env.CA_PATH +
      "";
  }
  await mongoose.connect(DB_URL);
  console.info("Connected to the database");
  console.info(
    `Database Host: ${mongoose.connection.host}\nDatabase Port: ${mongoose.connection.port}\nDatabase Name: ${mongoose.connection.name}`
  );
};
app.use("/v1", usersRoute);
app.use("/v1", organizationsRoute);
app.use("/v1", contributionsRoute);
app.use("/v1", healthCheckRoute);

app.get("*", (req, res) => {
  let message =
    "Resource not found, please go to /v1/docs to see all the available routes and resources.";
  if (process.env.NODE_ENV === "production") {
    message = "Resource not found, check your connection and try again.";
  }
  res.status(404).json({
    message: message,
  });
});

app.listen(port, async () => {
  console.log(`Express server listening on port: ${port}`);
  await ConnectToDB();
});

// Listen for the signal that there is an uncaught exception
process.on("uncaughtException", async err => {
  console.error(
    `There is an error server can't continue running, "THE ERROR": ${err}`
  );
  mongoose.disconnect(() => {
    console.log("Database disconnected");
  });
  console.log("server is closed");
  process.exit(1);
});
