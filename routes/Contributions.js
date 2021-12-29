import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";

const router = express.Router();

const GetLast30DaysCommits = _commitsList => {
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString();

  const last30Days = currentDate.setDate(currentDate.getDate() - 30);
  const last30DaysString = new Date(last30Days).toISOString();

  const last30DaysCommits = _commitsList.filter(commit => {
    if (
      new Date(commit.occurredAt) >= new Date(last30DaysString) &&
      new Date(commit.occurredAt) <= new Date(currentDateString)
    ) {
      return true;
    }
    return false;
  });

  return last30DaysCommits;
};

const countLastMonthCommits = async () => {
  let users = await User.find({}, "commit_contributions");
  let commitsList = [];
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      for (const commit of repo.commits) {
        commitsList.push(commit);
      }
    }
  }
  const lastMonthsCommits = GetLast30DaysCommits(commitsList);

  let count = 0;
  for (const contribution of lastMonthsCommits) {
    count += contribution.commitCount;
  }
  return count;
};

/**
 * @swagger
 * tags:
 *   name: Contributions
 *   description: The Contributions Routes
 */
/**
 *  @swagger
 *  /v1/contributions:
 *    get:
 *      summary: Returns information about the contributions
 *      tags: [Contributions]
 *      responses:
 *        200:
 *          description: The request was successful
 *        404:
 *          description: Check your internet connection and try again
 */
router.get("/contributions", async (req, res) => {
  let commits_last_month = await countLastMonthCommits();
  res.status(200).json({
    success: true,
    commits_last_month,
  });
});

export default router;
