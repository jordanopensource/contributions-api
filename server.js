import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import responseTime from "response-time";
import helmet from "helmet";

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

app.listen(port, () => {
  console.log(`Express server listening on port: ${port}`);
});
