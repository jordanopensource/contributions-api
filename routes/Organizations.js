import Mongoose from "mongoose";
import express from "express";

import Organization from "../models/organization.js";

const router = express.Router();

router.get("/organizations", async (req, res) => {
  let { limit, page } = req.query;
  page = !page ? 1 : page;
  limit = limit ? Number(limit) : 100;
  let organizations = await Organization.paginate(
    {},
    { page: page, limit: limit }
  );
  res.status(200).json({ success: true, organizations });
});

router.get("/organizations/:username", async (req, res) => {
  let { username } = req.params;
  let org = await Organization.findOne({ username: username });
  res.status(200).json({ success: true, org });
});

router.get("/organizations/:username/repos", async (req, res) => {
  let { username } = req.params;
  let orgRepositories = await Organization.findOne(
    { username: username },
    "repositories"
  );
  res.status(200).json({ success: true, data: orgRepositories });
});

export default router;
