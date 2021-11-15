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
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to the database");
};
app.use("/v1", usersRoute);
app.use("/v1", organizationsRoute);
app.use("/v1", contributionsRoute);

app.get("*", (req, res) => {
  res.status(404).json({
    message:
      "Resource not found, please go to /api/v1/docs to see all the available routes and resources.",
  });
});

app.listen(port, async () => {
  console.log(`Express server listening on port: ${port}`);
  await ConnectToDB();
});
