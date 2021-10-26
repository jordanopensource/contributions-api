import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import responseTime from "response-time";
import helmet from "helmet";

import usersRoute from "./routes/Users.js";

dotenv.config({
  path: "./config.env",
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet.hidePoweredBy());
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

app.use("/api", usersRoute);

app.listen(port, async () => {
  console.log(`Express server listening on port: ${port}`);
  await ConnectToDB();
});
