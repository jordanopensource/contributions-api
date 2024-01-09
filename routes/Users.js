import Mongoose from "mongoose";
import express from "express";
import Fuse from "fuse.js";

import User from "../models/user.js";

const router = express.Router();

let firstVisit = true;
let usersArray = [];
let usersToAdd = [];

const FetchUsers = async () => {
  usersArray = await User.find(
    {},
    "username name commit_contributions avatar_url github_profile_url isJOSAMember"
  );
};

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

const GetThisYearCommits = _commitsList => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentYearCommits = _commitsList.filter(commit => {
    if (new Date(commit.occurredAt).getFullYear() === currentYear) {
      return true;
    }
    return false;
  });

  return currentYearCommits;
};

const GetLastYearCommits = _commitsList => {
  const currentDate = new Date();
  const lastYear = currentDate.getFullYear() - 1;
  const lastYearCommits = _commitsList.filter(commit => {
    if (new Date(commit.occurredAt).getFullYear() === lastYear) {
      return true;
    }
    return false;
  });

  return lastYearCommits;
};

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

const GetThePerviousMonthCommits = _commitsList => {
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1));

  const lastMonthCommits = _commitsList.filter(commit => {
    if (
      new Date(commit.occurredAt).getMonth() === lastMonth.getMonth() &&
      new Date(commit.occurredAt).getFullYear() === lastMonth.getFullYear()
    ) {
      return true;
    }
    return false;
  });

  return lastMonthCommits;
};

const usersResponse = (_usersArray, _periodFunc, _rankFunc) => {
  let unRankedUsers = [];

  for (let user of _usersArray) {
    let userScore = 0;
    let userCommitsCount = 0;
    for (let repo of user.commit_contributions) {
      let repoCommitCount = 0;
      let commitsInThisPeriod = _periodFunc(repo.commits);
      for (const commit of commitsInThisPeriod) {
        userCommitsCount += commit.commitCount;
        repoCommitCount += commit.commitCount;
      }
      let repoStarsCount = repo.starsCount ? repo.starsCount : 1;
      userScore += Math.ceil(repoCommitCount * Math.log10(repoStarsCount));
    }

    let newUserObject = {
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      profile_url: user.github_profile_url,
      commitsTotalCount: userCommitsCount,
      score: userScore,
      isJOSAMember: user.isJOSAMember,
    };
    unRankedUsers.push(newUserObject);
  }
  const rankedUsers = _rankFunc(unRankedUsers);

  return rankedUsers;
};

const getUsers = async (usersArray, sort_by, period, page, limit, search) => {
  let users = [];
  let rankedUsers = [];
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  let totalUsers = usersArray.length;
  let totalPages = Math.ceil(usersArray.length / limit);

  if (period === "last_30_days") {
    if (sort_by === "score") {
      const rankedUsers = usersResponse(
        usersArray,
        GetLast30DaysCommits,
        RankUsersByScore
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    } else if (sort_by === "commit") {
      rankedUsers = usersResponse(
        usersArray,
        GetLast30DaysCommits,
        RankUsersByContributions
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    }
  } else if (period === "this_year") {
    if (sort_by === "score") {
      rankedUsers = usersResponse(
        usersArray,
        GetThisYearCommits,
        RankUsersByScore
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    } else if (sort_by === "commit") {
      rankedUsers = usersResponse(
        usersArray,
        GetThisYearCommits,
        RankUsersByContributions
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    }
  } else if (period === "last_month") {
    if (sort_by === "score") {
      rankedUsers = usersResponse(
        usersArray,
        GetThePerviousMonthCommits,
        RankUsersByScore
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    } else if (sort_by === "commit") {
      rankedUsers = usersResponse(
        usersArray,
        GetThePerviousMonthCommits,
        RankUsersByContributions
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    }
  } else if (period === "last_year") {
    if (sort_by === "score") {
      rankedUsers = usersResponse(
        usersArray,
        GetLastYearCommits,
        RankUsersByScore
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    } else if (sort_by === "commit") {
      rankedUsers = usersResponse(
        usersArray,
        GetLastYearCommits,
        RankUsersByContributions
      );
      if (search) {
        const searchResults = searchUsers(rankedUsers, search);
        totalUsers = searchResults.length;
        totalPages = Math.ceil(searchResults.length / limit);
        users = searchResults.slice(startIndex, endIndex);
      } else {
        users = rankedUsers.slice(startIndex, endIndex);
      }
    }
  }

  return { users, totalUsers, totalPages };
};

const searchUsers = (usersArray, search) => {
  const options = {
    // At what point does the match algorithm give up.
    // A threshold of 0.0 requires a perfect match (of both letters and location),
    // a threshold of 1.0 would match anything.
    threshold: 0.1,
    isCaseSensitive: false,
    // Search in `username` and in `name`
    keys: ["username", "name"],
  };

  const users = [];

  const fuse = new Fuse(usersArray, options);

  const results = fuse.search(search);

  for (const user of results) {
    users.push(user.item);
  }

  return users;
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
  let { limit, page, sort_by, period, contributors, search } = req.query;
  limit = limit ? Number(limit) : 5;
  page = !page ? 1 : page;
  sort_by = !sort_by ? "score" : sort_by;
  period = !period ? "last_30_days" : period;
  contributors = !contributors ? "all" : contributors;

  if (firstVisit === true) {
    firstVisit = false;
    await FetchUsers();
    // Update the users every 1 hour
    setInterval(FetchUsers, 60 * 60 * 1000);
  }

  if (contributors === "all") {
    const { users, totalUsers, totalPages } = await getUsers(
      usersArray,
      sort_by,
      period,
      page,
      limit,
      search
    );
    res.status(200).json({
      success: true,
      users,
      totalUsers,
      totalPages,
    });
  } else if (contributors === "members") {
    const josaMembers = await User.find(
      { isJOSAMember: true },
      "username name commit_contributions avatar_url github_profile_url isJOSAMember"
    );
    const { users, totalUsers, totalPages } = await getUsers(
      josaMembers,
      sort_by,
      period,
      page,
      limit,
      search
    );
    res.status(200).json({
      success: true,
      users: users,
      totalUsers,
      totalPages,
    });
  } else {
    res.status(404).json({
      success: false,
      message:
        "Invalid contributors query parameter, please specify 'all' or 'members'.",
    });
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
  if (user) {
    res.status(200).json({
      success: true,
      data: user,
    });
  } else {
    res.status(404).json({
      success: true,
      message: "there is no data for this user",
    });
  }
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
  if (userCommits) {
    res.status(200).json({
      success: true,
      data: userCommits.commit_contributions,
    });
  } else {
    usersToAdd.push(username);
    res.status(404).json({
      success: true,
      message: "there is no data for this user",
    });
  }
});

router.get("/usersToAdd", async (req, res) => {
  res.status(200).json({
    success: true,
    data: usersToAdd,
  });
});

router.post("/users", async (req, res) => {
  const { username } = req.body;
  if (username) {
    usersToAdd.push(username);
    res.status(200).json({
      success: true,
      message: "user has been added to the list",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "please supply the username in the body",
    });
  }
});

export default router;
