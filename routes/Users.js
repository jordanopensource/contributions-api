import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";

const router = express.Router();

let firstVisit = true;
let usersArray = [];

const RankUsersByScore = _usersArray => {
  let startingRank = 1;
  let currentRank = startingRank;
  let rankValue = null;
  let userRanks = [];

  let usersSorted = _usersArray.slice().sort((a, b) => {
    return b.score - a.score;
  });
  usersSorted.forEach(user => {
    if (user.score !== rankValue && rankValue !== null) {
      currentRank++;
    }
    userRanks.push({
      ...user,
      currentRank,
    });
    rankValue = user.score;
  });

  return userRanks;
};

const RankUsersByContributions = _usersArray => {
  let startingRank = 1;
  let currentRank = startingRank;
  let rankValue = null;
  let userRanks = [];

  let usersSorted = _usersArray.sort((a, b) => {
    return b.commitsTotalCount - a.commitsTotalCount;
  });
  usersSorted.forEach(user => {
    if (user.commitsTotalCount !== rankValue && rankValue !== null) {
      currentRank++;
    }
    userRanks.push({
      ...user,
      currentRank,
    });
    rankValue = user.commitsTotalCount;
  });

  return userRanks;
};

/**
 * @swagger
 * components:
 *  schemas:
 *      user:
 *        type: object
 *        required:
 *            - _id
 *            - username
 *            - github_id
 *        properties:
 *         _id:
 *          type: string
 *          description: The auto-generated id of the user
 *         username:
 *          type: string
 *          description: The username of the user
 *         github_id:
 *          type: string
 *          description: The Github id of the user
 *         avatar_url:
 *          type: string
 *          description: The URL of the user's avatar
 *         name:
 *          type: string
 *          description: the full name of the user
 *         location:
 *          type: string
 *          description: the location of the user
 *         bio:
 *          type: string
 *          description: the bio of the user
 *         company:
 *          type: string
 *          description: the company of the user
 *         github_profile_url:
 *          type: string
 *          description: the URL of the user's' Github profile
 *         user_createdAt:
 *          type: string
 *          description: the date the user got created on Github
 *         commit_contributions:
 *          type: array
 *          description: An Array of repositories that the user has contributed to
 *         score:
 *          type: number
 *          description: the accumulated score of the user based on their contributions
 *        example:
 *          _id: 616579b41ec858259f6058d8
 *          username: muayyad-alsadi
 *          github_id: MDQ6VXNlcjEzMTI2ODM=
 *          avatar_url: https://avatars.githubusercontent.com/u/1312683?u=2daa7002f83fd131c4f2b6d0482b1d48fca4b022&v=4
 *          name: Muayyad Alsadi
 *          location: Jordan
 *          bio: Opensource contributor and freesoftware advocate
 *          company: OpenSooq
 *          github_profile_url: https://github.com/muayyad-alsadi
 *          user_createdAt: 2012-01-08T08:55:14Z
 *          commit_contributions: [{repositoryName: podman-compose, starsCount: 2211, url: https://github.com/containers/podman-compose, commits: []}]
 *          score: 2211
 */
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users Routes
 */
/**
 *  @swagger
 *  /v1/users:
 *    get:
 *      summary: Returns the list of all the Users
 *      tags: [Users]
 *      parameters:
 *        - in: query
 *          name: limit
 *          schema:
 *            type: integer
 *          description: The number of items to return, default is 5
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *          description: The page number to return the users from
 *        - in: query
 *          name: sort
 *          schema:
 *            type: string
 *          description: Sort the users by their score ascending or descending, use asc for ascending, default value is descending
 *        - in: query
 *          name: sort_by
 *          schema:
 *            type: string
 *          description: Sort the users by their score or commit count, use score or commit, default value is score
 *      responses:
 *        200:
 *          description: The list of users
 *          content:
 *            application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/user"
 *        404:
 *           description: Check your internet connection
 */
router.get("/users", async (req, res) => {
  let { limit, page, sort_by, period } = req.query;
  limit = limit ? Number(limit) : 5;
  page = !page ? 1 : page;
  sort_by = !sort_by ? "score" : sort_by;
  period = !period ? "last_30_days" : period;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  if (firstVisit === true) {
    usersArray = await User.find(
      {},
      "username name commit_contributions avatar_url"
    );
    firstVisit = false;
  }

  if (period === "last_30_days") {
    if (sort_by === "score") {
      const rankedUsers = usersResponse(
        usersArray,
        GetLast30DaysCommits,
        RankUsersByScore
      );
      const users = rankedUsers.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        users,
      });
    } else if (sort_by === "commit") {
      const rankedUsers = usersResponse(
        usersArray,
        GetLast30DaysCommits,
        RankUsersByContributions
      );
      const users = rankedUsers.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        users,
      });
    }
  } else if (period === "this_year") {
    if (sort_by === "score") {
      const rankedUsers = usersResponse(
        usersArray,
        GetThisYearCommits,
        RankUsersByScore
      );
      const users = rankedUsers.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        users,
      });
    } else if (sort_by === "commit") {
      const rankedUsers = usersResponse(
        usersArray,
        GetThisYearCommits,
        RankUsersByContributions
      );
      const users = rankedUsers.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        users,
      });
    }
  } else if (period === "last_month") {
    if (sort_by === "score") {
      const rankedUsers = usersResponse(
        usersArray,
        GetThePerviousMonthCommits,
        RankUsersByScore
      );
      const users = rankedUsers.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        users,
      });
    } else if (sort_by === "commit") {
      const rankedUsers = usersResponse(
        usersArray,
        GetThePerviousMonthCommits,
        RankUsersByContributions
      );
      const users = rankedUsers.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        users,
      });
    }
  }
});

/**
 *  @swagger
 *  /v1/users/{username}:
 *    get:
 *      summary: Returns a specific User by username
 *      tags: [Users]
 *      parameters:
 *        - in: path
 *          name: username
 *          schema:
 *            type: string
 *          required: true
 *          description: The username of the user
 *      responses:
 *        200:
 *          description: The User object
 *        404:
 *          description: The User does not exist
 */
router.get("/users/:username", async (req, res) => {
  let { username } = req.params;
  let user = await User.findOne({ username: username });
  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 *  @swagger
 *  /v1/users/{username}/commits:
 *    get:
 *      summary: Returns a list of contributions for a given User
 *      tags: [Users]
 *      parameters:
 *        - in: path
 *          name: username
 *          schema:
 *            type: string
 *          required: true
 *          description: The username of the user
 *      responses:
 *        200:
 *          description: The repositories that the user has contributed to
 *        404:
 *          description: The User does not exist
 */
router.get("/users/:username/commits", async (req, res) => {
  let { username } = req.params;
  let userCommits = await User.findOne(
    { username: username },
    "commit_contributions"
  );
  res.status(200).json({
    success: true,
    data: userCommits.commit_contributions,
  });
});

export default router;
