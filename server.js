import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import responseTime from "response-time";
import helmet from "helmet";

import usersRoute from "./routes/Users.js";
import organizationsRoute from "./routes/Organizations.js";

import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

dotenv.config({
  path: "./config.env",
});

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

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet.hidePoweredBy());
app.use(cors());
const port = process.env.PORT;

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
  app.use(responseTime());
}

const ConnectToDB = async () => {
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to the database");
};
app.use("/api/v1/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpecs));
app.use("/api/v1", usersRoute);
app.use("/api/v1", organizationsRoute);

app.listen(port, async () => {
  console.log(`Express server listening on port: ${port}`);
  await ConnectToDB();
});
