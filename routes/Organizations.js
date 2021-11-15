import Mongoose from "mongoose";
import express from "express";

import Organization from "../models/organization.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *  schemas:
 *      organization:
 *        type: object
 *        required:
 *            - _id
 *            - username
 *            - github_id
 *        properties:
 *         _id:
 *          type: string
 *          description: The auto-generated id of the organization
 *         username:
 *          type: string
 *          description: The username of the organization
 *         github_id:
 *          type: string
 *          description: The Github id of the organization
 *         avatar_url:
 *          type: string
 *          description: The URL of the organization's avatar
 *         name:
 *          type: string
 *          description: the name of the organization
 *         location:
 *          type: string
 *          description: the location of the organization
 *         github_profile_url:
 *          type: string
 *          description: the URL of the organization's' Github profile
 *         repositories:
 *          type: array
 *          description: An Array of the public repositories that the organization created
 *        example:
 *          _id: 6171b055aeafbf969a7890fb
 *          username: jordanopensource
 *          github_id: MDEyOk9yZ2FuaXphdGlvbjg1ODIxOA==
 *          avatar_url: https://avatars.githubusercontent.com/u/858218?v=4
 *          name: Jordan Open Source Association
 *          location: Amman, Jordan
 *          github_profile_url: https://github.com/muayyad-alsadi
 *          repositories: [{name: awesome-jordan, starsCount: 38}]
 */
/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: The Organizations Routes
 */
/**
 *  @swagger
 *  /v1/orgs:
 *    get:
 *      summary: Returns the list of all the Organizations
 *      tags: [Organizations]
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
 *          description: The page number to return the organizations from
 *        - in: query
 *          name: sort
 *          schema:
 *            type: string
 *          description: Sort the organizations by their repositories number ascending or descending, use asc or desc
 *      responses:
 *        200:
 *          description: The list of organizations
 *          content:
 *            application/json:
 *                schema:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/organization"
 *        404:
 *           description: Check your internet connection
 */
router.get("/orgs", async (req, res) => {
  let { limit, page, sort } = req.query;
  page = !page ? 1 : page;
  limit = limit ? Number(limit) : 100;
  let orgs = [];
  switch (sort) {
    case "asc":
      orgs = await Organization.paginate(
        {},
        { page, limit, sort: { repositories_count: 1 } }
      );
      break;
    case "desc":
      orgs = await Organization.paginate(
        {},
        { page, limit, sort: { repositories_count: -1 } }
      );
      break;
    default:
      orgs = await Organization.paginate({}, { page, limit, sort: {} });
      break;
  }
  res.status(200).json({ success: true, orgs });
});

/**
 *  @swagger
 *  /v1/orgs/{username}:
 *    get:
 *      summary: Returns a specific Organization by its username
 *      tags: [Organizations]
 *      parameters:
 *        - in: path
 *          name: username
 *          schema:
 *            type: string
 *          required: true
 *          description: The username of the Organization
 *      responses:
 *        200:
 *          description: The Organization object
 *        404:
 *          description: The Organization does not exist
 */
router.get("/orgs/:username", async (req, res) => {
  let { username } = req.params;
  let org = await Organization.findOne({ username: username });
  res.status(200).json({ success: true, org });
});

/**
 *  @swagger
 *  /v1/orgs/{username}/repos:
 *    get:
 *      summary: Returns a list of all public repositories for a given Organization
 *      tags: [Organizations]
 *      parameters:
 *        - in: path
 *          name: username
 *          schema:
 *            type: string
 *          required: true
 *          description: The username of the Organization
 *      responses:
 *        200:
 *          description: The Organization object
 *        404:
 *          description: The Organization does not exist
 */
router.get("/orgs/:username/repos", async (req, res) => {
  let { username } = req.params;
  let orgRepositories = await Organization.findOne(
    { username: username },
    "repositories"
  );
  res.status(200).json({ success: true, data: orgRepositories });
});

export default router;
