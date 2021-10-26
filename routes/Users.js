import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";

const router = express.Router();

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
 *  /api/v1/users:
 *    get:
 *      summary: Returns the list of all the Users
 *      tags: [Users]
 *      parameters:
 *        - in: query
 *          name: limit
 *          schema:
 *            type: integer
 *          description: The number of items to return
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *          description: The page number to return the users from
 *        - in: query
 *          name: sort
 *          schema:
 *            type: string
 *          description: Sort the users by their score ascending or descending, use asc or desc
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
  let { sort, limit, page } = req.query;
  limit = limit ? Number(limit) : 100;
  let users = [];
  switch (sort) {
    case "asc":
      users = await User.paginate({}, { page, limit, sort: { score: 1 } });
      break;
    case "desc":
      users = await User.paginate({}, { page, limit, sort: { score: -1 } });
      break;
    default:
      users = await User.paginate({}, { page, limit, sort: {} });
      break;
  }
  res.status(200).json({
    success: true,
    users,
  });
});

/**
 *  @swagger
 *  /api/v1/users/{username}:
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
 *  /api/v1/users/{username}/commits:
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
