import { Mongoose } from "mongoose";
import express from "express";

const router = express.Router();

router.get("/users", (req, res) => {
  res.status(200).json({
    success: true,
  });
});

export default router;
