import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";

const router = express.Router();

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
  // Get last date
  let last = commitsList.map(obj => obj.occurredAt).sort()[
    commitsList.length - 1
  ];
  // Get objects in last month
  let lastMonthsCommits = commitsList.filter(
    obj => obj.occurredAt.substr(0, 7) == last.substr(0, 7)
  );

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
 *  /api/v1/contributions:
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
