import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  let users = [];
  let { sort, limit } = req.query;
  limit = limit ? Number(limit) : 100;
  switch (sort) {
    case "asc":
      users = await User.find().sort({ score: 1 }).limit(limit);
      break;
    case "desc":
      users = await User.find().sort({ score: -1 }).limit(limit);
      break;
    default:
      users = await User.find().sort({}).limit(limit);
      break;
  }
  res.status(200).json({
    success: true,
    data: users,
  });
});

export default router;
