import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";
import Organization from "../models/organization.js";
import Stat from "../models/stat.js";

const router = express.Router();

const getDaysInAMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

const getLast30DaysContributions = _contributionsList => {
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString();

  const last30Days = currentDate.setDate(currentDate.getDate() - 30);
  const last30DaysString = new Date(last30Days).toISOString();

  const last30DaysContributions = _contributionsList.filter(contribution => {
    if (
      new Date(contribution.occurredAt) >= new Date(last30DaysString) &&
      new Date(contribution.occurredAt) <= new Date(currentDateString)
    ) {
      return true;
    }
    return false;
  });

  return last30DaysContributions;
};

const countLast30DaysContributions = async () => {
  let users = await User.find(
    {},
    "commit_contributions issue_contributions pr_contributions code_review_contributions"
  );
  let contributionsList = [];
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      for (const commit of repo.commits) {
        contributionsList.push(commit);
      }
    }
    for (const repo of user.issue_contributions) {
      for (const issue of repo.issues) {
        contributionsList.push(issue);
      }
    }
    for (const repo of user.pr_contributions) {
      for (const pullRequest of repo.pullRequests) {
        contributionsList.push(pullRequest);
      }
    }
    for (const repo of user.code_review_contributions) {
      for (const codeReview of repo.codeReviews) {
        contributionsList.push(codeReview);
      }
    }
  }
  const last30DaysContributions = getLast30DaysContributions(contributionsList);

  let count = 0;
  for (const contribution of last30DaysContributions) {
    if (contribution?.commitCount) {
      count += contribution.commitCount;
    } else {
      count += 1;
    }
  }
  return count;
};

const countUsersCreatedBeforeDate = async date => {
  return await User.find({
    user_createdAt: {
      $lt: date,
    },
  }).countDocuments();
};

const getUsersCreatedBetweenTwoDates = async (startDate, endDate) => {
  return await User.find(
    {
      user_createdAt: {
        $gte: startDate + "T00:00:00.000Z",
        $lte: endDate + "T23:59:59.999Z",
      },
    },
    "user_createdAt"
  );
};

const getOrganizationsCreatedBetweenTwoDates = async (startDate, endDate) => {
  return await Organization.find(
    {
      organization_createdAt: {
        $gte: startDate + "T00:00:00.000Z",
        $lte: endDate + "T23:59:59.999Z",
      },
    },
    "organization_createdAt"
  );
};

const countUsersCreatedBetweenTwoDates = async (startDate, endDate) => {
  return await User.find({
    user_createdAt: {
      $gte: startDate + "T00:00:00.000Z",
      $lte: endDate + "T23:59:59.999Z",
    },
  }).countDocuments();
};

const countOrganizationsCreatedBeforeDate = async date => {
  return await Organization.find({
    organization_createdAt: {
      $lt: date,
    },
  }).countDocuments();
};

const accumulatedTotalOrganizationsByMonth = async periodArray => {
  let organizations = await getOrganizationsCreatedBetweenTwoDates(
    periodArray[0],
    periodArray[1]
  );

  let organizationsCreatedByMonth = {};
  for (const organization of organizations) {
    let date = new Date(organization.organization_createdAt);
    let month = date.getMonth();
    let year = date.getFullYear();
    if (organizationsCreatedByMonth[year] === undefined) {
      organizationsCreatedByMonth[year] = {};
    }
    if (organizationsCreatedByMonth[year][month] === undefined) {
      organizationsCreatedByMonth[year][month] = 0;
    }
    organizationsCreatedByMonth[year][month]++;
  }

  let organizationsCreatedAccumulationByMonth = {};
  for (const year in organizationsCreatedByMonth) {
    organizationsCreatedAccumulationByMonth[year] = [];
    let accumulation = await countOrganizationsCreatedBeforeDate(year);
    for (const month in organizationsCreatedByMonth[year]) {
      accumulation += organizationsCreatedByMonth[year][month];
      organizationsCreatedAccumulationByMonth[year][month] = accumulation;
    }
  }

  return organizationsCreatedAccumulationByMonth;
};

const accumulatedTotalOrganizationsByDay = async periodArray => {
  let organizations = await getOrganizationsCreatedBetweenTwoDates(
    periodArray[0],
    periodArray[1]
  );

  let organizationsCreatedByDay = {};
  for (const organization of organizations) {
    let date = new Date(organization.organization_createdAt);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    if (organizationsCreatedByDay[year] === undefined) {
      organizationsCreatedByDay[year] = {};
    }
    if (organizationsCreatedByDay[year][month] === undefined) {
      organizationsCreatedByDay[year][month] = new Array(
        Number(getDaysInAMonth(month, year))
      ).fill(0);
    }
    if (organizationsCreatedByDay[year][month][day] === undefined) {
      organizationsCreatedByDay[year][month][day] = 0;
    }
    organizationsCreatedByDay[year][month][day]++;
  }

  let organizationsCreatedAccumulationByDay = {};
  for (const year in organizationsCreatedByDay) {
    organizationsCreatedAccumulationByDay[year] = {};
    for (const month in organizationsCreatedByDay[year]) {
      organizationsCreatedAccumulationByDay[year][month] = [];
      let accumulation = await countOrganizationsCreatedBeforeDate(
        new Date(year, month, 1).toISOString()
      );
      for (const day in organizationsCreatedByDay[year][month]) {
        accumulation += organizationsCreatedByDay[year][month][day];
        organizationsCreatedAccumulationByDay[year][month][day] = accumulation;
      }
    }
  }

  return organizationsCreatedAccumulationByDay;
};

const accumulatedTotalUsersByMonth = async periodArray => {
  let users = await getUsersCreatedBetweenTwoDates(
    periodArray[0],
    periodArray[1]
  );

  let usersCreatedByMonth = {};
  for (const user of users) {
    let date = new Date(user.user_createdAt);
    let month = date.getMonth();
    let year = date.getFullYear();
    if (usersCreatedByMonth[year] === undefined) {
      usersCreatedByMonth[year] = {};
    }
    if (usersCreatedByMonth[year][month] === undefined) {
      usersCreatedByMonth[year][month] = 0;
    }
    usersCreatedByMonth[year][month]++;
  }

  let usersCreatedAccumulationByMonth = {};
  for (const year in usersCreatedByMonth) {
    usersCreatedAccumulationByMonth[year] = [];
    let accumulation = await countUsersCreatedBeforeDate(year);
    for (const month in usersCreatedByMonth[year]) {
      accumulation += usersCreatedByMonth[year][month];
      usersCreatedAccumulationByMonth[year][month] = accumulation;
    }
  }

  return usersCreatedAccumulationByMonth;
};

const accumulatedTotalUsersByDay = async periodArray => {
  let users = await getUsersCreatedBetweenTwoDates(
    periodArray[0],
    periodArray[1]
  );

  let usersCreatedByDay = {};
  for (const user of users) {
    let date = new Date(user.user_createdAt);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    if (usersCreatedByDay[year] === undefined) {
      usersCreatedByDay[year] = {};
    }
    if (usersCreatedByDay[year][month] === undefined) {
      usersCreatedByDay[year][month] = new Array(
        Number(getDaysInAMonth(month, year))
      ).fill(0);
    }
    if (usersCreatedByDay[year][month][day] === undefined) {
      usersCreatedByDay[year][month][day] = 0;
    }
    usersCreatedByDay[year][month][day]++;
  }

  let usersCreatedAccumulationByDay = {};
  for (const year in usersCreatedByDay) {
    usersCreatedAccumulationByDay[year] = {};
    for (const month in usersCreatedByDay[year]) {
      usersCreatedAccumulationByDay[year][month] = [];
      let accumulation = await countUsersCreatedBeforeDate(
        new Date(year, month, 1).toISOString()
      );
      for (const day in usersCreatedByDay[year][month]) {
        accumulation += usersCreatedByDay[year][month][day];
        usersCreatedAccumulationByDay[year][month][day] = accumulation;
      }
    }
  }
  return usersCreatedAccumulationByDay;
};

const accumulatedTotalContributionsByMonth = async (from, to) => {
  let users = await User.find(
    {},
    "commit_contributions issue_contributions pr_contributions code_review_contributions"
  );
  let contributionsList = [];
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      for (const commit of repo.commits) {
        if (commit.occurredAt >= from && commit.occurredAt <= to) {
          contributionsList.push(commit);
        }
      }
    }
    for (const repo of user.issue_contributions) {
      for (const issue of repo.issues) {
        if (issue.occurredAt >= from && issue.occurredAt <= to) {
          contributionsList.push(issue);
        }
      }
    }
    for (const repo of user.pr_contributions) {
      for (const pullRequest of repo.pullRequests) {
        if (pullRequest.occurredAt >= from && pullRequest.occurredAt <= to) {
          contributionsList.push(pullRequest);
        }
      }
    }
    for (const repo of user.code_review_contributions) {
      for (const codeReview of repo.codeReviews) {
        if (codeReview.occurredAt >= from && codeReview.occurredAt <= to) {
          contributionsList.push(codeReview);
        }
      }
    }
  }

  let contributionsByMonth = {};
  for (const contribution of contributionsList) {
    let date = new Date(contribution.occurredAt);
    let month = date.getMonth();
    let year = date.getFullYear();
    if (contributionsByMonth[year] === undefined) {
      contributionsByMonth[year] = [];
    }
    if (contributionsByMonth[year][month] === undefined) {
      contributionsByMonth[year][month] = 0;
    }
    contributionsByMonth[year][month]++;
  }

  return contributionsByMonth;
};

const accumulatedTotalContributionsByDay = async (from, to) => {
  let users = await User.find(
    {},
    "commit_contributions issue_contributions pr_contributions code_review_contributions"
  );
  let contributionsList = [];
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      for (const commit of repo.commits) {
        if (commit.occurredAt >= from && commit.occurredAt <= to) {
          contributionsList.push(commit);
        }
      }
    }
    for (const repo of user.issue_contributions) {
      for (const issue of repo.issues) {
        if (issue.occurredAt >= from && issue.occurredAt <= to) {
          contributionsList.push(issue);
        }
      }
    }
    for (const repo of user.pr_contributions) {
      for (const pullRequest of repo.pullRequests) {
        if (pullRequest.occurredAt >= from && pullRequest.occurredAt <= to) {
          contributionsList.push(pullRequest);
        }
      }
    }
    for (const repo of user.code_review_contributions) {
      for (const codeReview of repo.codeReviews) {
        if (codeReview.occurredAt >= from && codeReview.occurredAt <= to) {
          contributionsList.push(codeReview);
        }
      }
    }
  }

  let contributionsByDay = {};
  for (const contribution of contributionsList) {
    let date = new Date(contribution.occurredAt);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    if (contributionsByDay[year] === undefined) {
      contributionsByDay[year] = {};
    }
    if (contributionsByDay[year][month] === undefined) {
      contributionsByDay[year][month] = new Array(
        Number(getDaysInAMonth(month, year))
      ).fill(0);
    }
    if (contributionsByDay[year][month][day] === undefined) {
      contributionsByDay[year][month][day] = 0;
    }
    contributionsByDay[year][month][day]++;
  }

  return contributionsByDay;
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
  let contributions_last_30_days = await countLast30DaysContributions();
  res.status(200).json({
    success: true,
    contributions_last_30_days,
  });
});

/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: The stats routes
 */
/**
 *  @swagger
 *  /v1/stats/contributors:
 *    get:
 *      summary: Returns the stats for the contributors
 *      tags: [Stats]
 *      parameters:
 *        - in: query
 *          name: type
 *          schema:
 *            type: string
 *          description: The type of the data to return users or commits, default is users
 *        - in: query
 *          name: period
 *          schema:
 *            type: string
 *          required: true
 *          description: The two dates to return the data between eg.. 2019-01-01_2019-01-31 (the two dates separated by underscore)
 *        - in: query
 *          name: aggregation
 *          schema:
 *            type: string
 *          description: Specifies to group and returns the data by month or day, default is month
 *      responses:
 *        200:
 *          description: The request was successful
 *        404:
 *          description: Check your internet connection and try again
 */
router.get("/contributors/stats", async (req, res) => {
  let { type, period, aggregation } = req.query;
  type = !type ? "users" : type;
  aggregation = !aggregation ? "month" : aggregation;

  if (period) {
    const periodArray = period.split("_");
    switch (type) {
      case "users":
        switch (aggregation) {
          case "month":
            const usersByMonth = await accumulatedTotalUsersByMonth(
              periodArray
            );
            res.status(200).json({
              success: true,
              usersStats: usersByMonth,
            });
            break;
          case "day":
            const usersByDay = await accumulatedTotalUsersByDay(periodArray);
            res.status(200).json({
              success: true,
              usersStats: usersByDay,
            });
            break;
          default:
            res.status(400).json({
              success: false,
              message: "Invalid aggregation type",
            });
            break;
        }
        break;

      case "contributions":
        switch (aggregation) {
          case "month":
            const commitsByMonth = await accumulatedTotalContributionsByMonth(
              periodArray[0],
              periodArray[1]
            );
            res.status(200).json({
              success: true,
              commitsStats: commitsByMonth,
            });
            break;

          case "day":
            const commitsByDay = await accumulatedTotalContributionsByDay(
              periodArray[0],
              periodArray[1]
            );
            res.status(200).json({
              success: true,
              commitsStats: commitsByDay,
            });
            break;

          default:
            res.status(400).json({
              success: false,
              message: "Invalid aggregation type",
            });
            break;
        }
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Invalid type",
        });
        break;
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Please specifiy a period of time",
    });
  }
});

router.get("/organizations/stats", async (req, res) => {
  let { period, aggregation } = req.query;
  aggregation = !aggregation ? "month" : aggregation;
  if (period) {
    const periodArray = period.split("_");
    switch (aggregation) {
      case "day":
        const organizationsByDay = await accumulatedTotalOrganizationsByDay(
          periodArray
        );
        res.status(200).json({
          success: true,
          organizationsStats: organizationsByDay,
        });
        break;
      default:
        const organizationsByMonth = await accumulatedTotalOrganizationsByMonth(
          periodArray
        );
        res.status(200).json({
          success: true,
          organizationsStats: organizationsByMonth,
        });
        break;
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Please specifiy a period of time",
    });
  }
});

router.get("/stats/updated", async (req, res) => {
  const stat = await Stat.findOne({}, {}, { sort: { "createdAt": -1 } });
  res.status(200).json({
    success: true,
    lastUpdated: stat.createdAt,
  });
});

export default router;
