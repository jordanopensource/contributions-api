import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";

const router = express.Router();

const GetLast30DaysCommits = _commitsList => {
  const currentDate = new Date();
  const currentDateTime = currentDate.getTime();
  const last30DaysDate = new Date(
    currentDate.setDate(currentDate.getDate() - 30)
  );
  const last30DaysDateTime = last30DaysDate.getTime();
  const lastMonthsCommits = _commitsList.filter(commit => {
    const elementDateTime = new Date(commit.occurredAt).getTime();
    if (
      elementDateTime <= currentDateTime &&
      elementDateTime > last30DaysDateTime
    ) {
      return true;
    }
    return false;
  });

  return lastMonthsCommits;
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
