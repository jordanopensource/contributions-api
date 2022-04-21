import Mongoose from "mongoose";
import express from "express";

import User from "../models/user.js";
import Organization from "../models/organization.js";

const router = express.Router();

/**
 * "Given a month and a year, return the number of days in that month."
 *
 * The function uses the Date object to create a new date for the first day of the next month. Then it
 * uses the getDate() method to get the date of the last day of the previous month
 * @param month - The month you want to get the days for.
 * @param year - The year to get the days in.
 * @returns The number of days in a month.
 */
const getDaysInAMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * It takes a list of commits and returns a list of commits that occurred in the last 30 days
 * @returns An array of commits that occurred in the last 30 days.
 */
const getLast30DaysCommits = _commitsList => {
  /* Get the current date. */
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString();

  /* Setting the date to 30 days ago. */
  const last30Days = currentDate.setDate(currentDate.getDate() - 30);
  const last30DaysString = new Date(last30Days).toISOString();

  /* Filtering the commits list to only include commits that occurred in the last 30 days. */
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

/**
 * It finds all the users in the database, then loops through each user's commit contributions, then
 * loops through each repo's commits, then pushes each commit to a list, then filters the list to only
 * include commits from the last 30 days, then loops through the filtered list and counts the number of
 * commits
 * @returns The number of commits made in the last 30 days.
 */
const countLast30DaysCommits = async () => {
  let users = await User.find({}, "commit_contributions");
  let commitsList = [];
  /* Iterating through the users array and pushing the commits into the commitsList array. */
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      for (const commit of repo.commits) {
        commitsList.push(commit);
      }
    }
  }
  const lastMonthsCommits = getLast30DaysCommits(commitsList);

  /* Counting the number of commits in the last month. */
  let count = 0;
  for (const contribution of lastMonthsCommits) {
    count += contribution.commitCount;
  }
  return count;
};

/**
 * @returns The number of users created before a certain date.
 */
const countUsersCreatedBeforeDate = async date => {
  return await User.find({
    user_createdAt: {
      $lt: date,
    },
  }).countDocuments();
};

/**
 * It returns an array of all users created between two dates
 * @param startDate - The start date of the range.
 * @param endDate - The end date of the range.
 * @returns An array of objects with the user_createdAt property.
 */
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

/**
 * It returns an array of all the organizations created between two dates
 * @param startDate - The start date of the range you want to search for.
 * @param endDate - The end date of the range.
 * @returns An array of objects with the organization_createdAt property.
 */
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

/**
 * It returns the number of users created between two dates
 * @param startDate - The start date of the range.
 * @param endDate - The end date of the range.
 * @returns The number of users created between two dates.
 */
const countUsersCreatedBetweenTwoDates = async (startDate, endDate) => {
  return await User.find({
    user_createdAt: {
      $gte: startDate + "T00:00:00.000Z",
      $lte: endDate + "T23:59:59.999Z",
    },
  }).countDocuments();
};

/**
 * @returns The number of documents in the Organization collection that have a createdAt date before
 * the date passed in.
 */
const countOrganizationsCreatedBeforeDate = async date => {
  return await Organization.find({
    organization_createdAt: {
      $lt: date,
    },
  }).countDocuments();
};

/**
 * It returns an object with the number of organizations created each month, and the total number of
 * organizations created up to that month.
 * @returns An object with the following structure:
 * {
 *   year: [
 *       month1: numberOfOrganizations,
 *       month2: numberOfOrganizations,
 *       ...
 *       monthN: numberOfOrganizations
 *     ]
 *
 * }
 */
const accumulatedTotalOrganizationsByMonth = async periodArray => {
  /* Getting the organizations created between two dates. */
  let organizations = await getOrganizationsCreatedBetweenTwoDates(
    periodArray[0],
    periodArray[1]
  );

  let organizationsCreatedByMonth = {};
  for (const organization of organizations) {
    let date = new Date(organization.organization_createdAt);
    let month = date.getMonth();
    let year = date.getFullYear();
    /* Checking to see if the year is undefined. If it is, it is creating a new object for that year. */
    if (organizationsCreatedByMonth[year] === undefined) {
      organizationsCreatedByMonth[year] = {};
    }
    /* Checking to see if the value of the month is undefined. If it is, it sets the value to 0. */
    if (organizationsCreatedByMonth[year][month] === undefined) {
      organizationsCreatedByMonth[year][month] = 0;
    }
    organizationsCreatedByMonth[year][month]++;
  }

  let organizationsCreatedAccumulationByMonth = {};
  for (const year in organizationsCreatedByMonth) {
    /* Creating an array for each year. */
    organizationsCreatedAccumulationByMonth[year] = [];
    /* Counting the number of organizations created before a certain date. */
    let accumulation = await countOrganizationsCreatedBeforeDate(year);
    /* Adding up the number of organizations created each month and storing the total in the
    organizationsCreatedAccumulationByMonth object. */
    for (const month in organizationsCreatedByMonth[year]) {
      accumulation += organizationsCreatedByMonth[year][month];
      organizationsCreatedAccumulationByMonth[year][month] = accumulation;
    }
  }

  return organizationsCreatedAccumulationByMonth;
};

/**
 * It returns An object with the number of organizations created by day.
 * @returns An object with the following structure:
 * {
 *   year: {
 *     month: [
 *       day1: numberOfOrganizations,
 *       day2: numberOfOrganizations,
 *       ...
 *       dayN: numberOfOrganizations
 *     ]
 *   }
 * }
 */
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
    /* Checking to see if the year is already in the object. If it is not, it creates a new object for
    that year. */
    if (organizationsCreatedByDay[year] === undefined) {
      organizationsCreatedByDay[year] = {};
    }

    /* Checking if the month is undefined, if it is, it is creating an array of the number of days in
    the month and filling it with 0's. */
    if (organizationsCreatedByDay[year][month] === undefined) {
      organizationsCreatedByDay[year][month] = new Array(
        Number(getDaysInAMonth(month, year))
      ).fill(0);
    }
    /* Checking to see if the value of day is undefined. If it is, it sets it to 0. */
    if (organizationsCreatedByDay[year][month][day] === undefined) {
      organizationsCreatedByDay[year][month][day] = 0;
    }
    organizationsCreatedByDay[year][month][day]++;
  }

  let organizationsCreatedAccumulationByDay = {};
  for (const year in organizationsCreatedByDay) {
    /* Creating an object for each year. */
    organizationsCreatedAccumulationByDay[year] = {};
    for (const month in organizationsCreatedByDay[year]) {
      /* Creating an array for each month of the year. */
      organizationsCreatedAccumulationByDay[year][month] = [];
      /* Counting the number of organizations created before a given date. */
      let accumulation = await countOrganizationsCreatedBeforeDate(
        new Date(year, month, 1).toISOString()
      );
      /* Adding up the number of organizations created each day and storing the total in the
      organizationsCreatedAccumulationByDay object. */
      for (const day in organizationsCreatedByDay[year][month]) {
        accumulation += organizationsCreatedByDay[year][month][day];
        organizationsCreatedAccumulationByDay[year][month][day] = accumulation;
      }
    }
  }

  return organizationsCreatedAccumulationByDay;
};

/**
 * It returns An object with the number of users created each month, and the total number of users
 * created up to that month.
 * /**
 * @returns An object with the following structure:
 * {
 *   year: [
 *       month1: numberOfUsers,
 *       month2: numberOfUsers,
 *       ...
 *       monthN: numberOfUsers
 *     ]
 *
 * }
 */
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
    /* Checking if the year is undefined, if it is, it will create a new object for that year. */
    if (usersCreatedByMonth[year] === undefined) {
      usersCreatedByMonth[year] = {};
    }
    /* Checking if the usersCreatedByMonth object has a property for the current year and month. If it
    does not, it creates a property for the current year and month and sets it to 0. */
    if (usersCreatedByMonth[year][month] === undefined) {
      usersCreatedByMonth[year][month] = 0;
    }
    usersCreatedByMonth[year][month]++;
  }

  let usersCreatedAccumulationByMonth = {};
  for (const year in usersCreatedByMonth) {
    /* Creating an array for each year. */
    usersCreatedAccumulationByMonth[year] = [];
    /* Counting the number of users created before a certain date. */
    let accumulation = await countUsersCreatedBeforeDate(year);
    /* Adding up the number of users created in each month and storing the total in the
    usersCreatedAccumulationByMonth object. */
    for (const month in usersCreatedByMonth[year]) {
      accumulation += usersCreatedByMonth[year][month];
      usersCreatedAccumulationByMonth[year][month] = accumulation;
    }
  }

  return usersCreatedAccumulationByMonth;
};

/**
 * It returns an object with the number of users created before each day of the period
 * @returns An object with the following structure:
 * {
 *   year: {
 *     month: [
 *       day1: numberOfUsers,
 *       day2: numberOfUsers,
 *       ...
 *       dayN: numberOfUsers
 *     ]
 *   }
 * }
 */
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
    /* Checking if the year is undefined, if it is, it will create a new object for that year. */
    if (usersCreatedByDay[year] === undefined) {
      usersCreatedByDay[year] = {};
    }
    /* Checking if the usersCreatedByDay object has a property with the current year and month. If it
    does not, it creates a new array with the number of days in the month and fills it with zeros. */
    if (usersCreatedByDay[year][month] === undefined) {
      usersCreatedByDay[year][month] = new Array(
        Number(getDaysInAMonth(month, year))
      ).fill(0);
    }
    /* Checking if the usersCreatedByDay object has a property for the current year, month, and day. If
    it does not, it sets the value of that property to 0. */
    if (usersCreatedByDay[year][month][day] === undefined) {
      usersCreatedByDay[year][month][day] = 0;
    }
    usersCreatedByDay[year][month][day]++;
  }

  let usersCreatedAccumulationByDay = {};
  for (const year in usersCreatedByDay) {
    /* Creating an object for each year. */
    usersCreatedAccumulationByDay[year] = {};
    for (const month in usersCreatedByDay[year]) {
      /* Creating an array for each month of the year. */
      usersCreatedAccumulationByDay[year][month] = [];
      let accumulation = await countUsersCreatedBeforeDate(
        new Date(year, month, 1).toISOString()
      );
      /* Adding up the number of users created each day and storing the total in the
      usersCreatedAccumulationByDay object. */
      for (const day in usersCreatedByDay[year][month]) {
        accumulation += usersCreatedByDay[year][month][day];
        usersCreatedAccumulationByDay[year][month][day] = accumulation;
      }
    }
  }
  return usersCreatedAccumulationByDay;
};

/**
 * It finds all the commits made by all the users in the database, and then groups them by month
 * @param from - The start date of the period you want to get the commits for.
 * @param to - The end date of the period you want to get the commits for.
 * @returns An object with the number of commits per month.
 */
const accumulatedTotalCommitsByMonth = async (from, to) => {
  /* Finding all users and returning their commit_contributions. */
  let users = await User.find({}, "commit_contributions");
  let commitsList = [];
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      /* Iterating through the commits in the repo and pushing the commits that
     occurred between the from and to dates into the commitsList array. */
      for (const commit of repo.commits) {
        if (commit.occurredAt >= from && commit.occurredAt <= to) {
          commitsList.push(commit);
        }
      }
    }
  }

  let commitsByMonth = {};
  for (const commit of commitsList) {
    let date = new Date(commit.occurredAt);
    let month = date.getMonth();
    let year = date.getFullYear();
    /* Checking to see if the year is already in the commitsByMonth array. If it is not, it adds it. */
    if (commitsByMonth[year] === undefined) {
      commitsByMonth[year] = [];
    }

    /* Checking if the commitsByMonth object has a property with the value of year and month. If it
    does not, it creates a new property with the value of year and month and sets it to 0. */
    if (commitsByMonth[year][month] === undefined) {
      commitsByMonth[year][month] = 0;
    }
    commitsByMonth[year][month]++;
  }

  return commitsByMonth;
};

/**
 * It finds all the commits made by all the users in the database, and then groups them by day in every month.
 * @param from - The start date of the period you want to get the commits for.
 * @param to - The end date of the range of dates you want to get the commits for.
 * @returns An object with the number of commits per day.
 */
const accumulatedTotalCommitsByDay = async (from, to) => {
  let users = await User.find({}, "commit_contributions");
  let commitsList = [];
  for (const user of users) {
    for (const repo of user.commit_contributions) {
      /* Looping through the commits in the repo and pushing the commits that occurred between the from
      and to dates into the commitsList array. */
      for (const commit of repo.commits) {
        if (commit.occurredAt >= from && commit.occurredAt <= to) {
          commitsList.push(commit);
        }
      }
    }
  }

  let commitsByDay = {};
  for (const commit of commitsList) {
    let date = new Date(commit.occurredAt);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    /* Checking to see if the year is already in the commitsByDay object. If it is not, it creates a
    new object for that year. */
    if (commitsByDay[year] === undefined) {
      commitsByDay[year] = {};
    }

    /* Checking if the commitsByDay object has a property with the year and month. If it does not, it
    creates a new array with the number of days in the month and fills it with 0s. */
    if (commitsByDay[year][month] === undefined) {
      commitsByDay[year][month] = new Array(
        Number(getDaysInAMonth(month, year))
      ).fill(0);
    }

    /* Checking if the commitsByDay object has a property with the year, month, and day. If it does
    not, it sets the value to 0. */
    if (commitsByDay[year][month][day] === undefined) {
      commitsByDay[year][month][day] = 0;
    }
    commitsByDay[year][month][day]++;
  }

  return commitsByDay;
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
  let commits_last_30_days = await countLast30DaysCommits();
  res.status(200).json({
    success: true,
    commits_last_30_days,
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
  /* Checking if the type variable is set. If it is not set, it will set it to "users". */
  type = !type ? "users" : type;
  /* Checking if aggregation is set, if it is not set, it will set aggregation to "month". */
  aggregation = !aggregation ? "month" : aggregation;

  if (period) {
    /* Split the period variable into an array. */
    const periodArray = period.split("_");
    /* A switch statement that is checking the type and aggregation parameters.
    Depending on the type and aggregation parameters, the code will call the appropriate function to
    get the data from the database. */
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

      case "commits":
        switch (aggregation) {
          case "month":
            const commitsByMonth = await accumulatedTotalCommitsByMonth(
              periodArray[0],
              periodArray[1]
            );
            res.status(200).json({
              success: true,
              commitsStats: commitsByMonth,
            });
            break;

          case "day":
            const commitsByDay = await accumulatedTotalCommitsByDay(
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

      /* If the type parameter is not "commits" or "users", it will return an error. */
      default:
        res.status(400).json({
          success: false,
          message: "Invalid type",
        });
        break;
    }
  } /* The above code is checking to see if the user has specified a period of time. If they have, it
  will return the data for that period of time. If they have not, it will return an error message. */ else {
    res.status(400).json({
      success: false,
      message: "Please specifiy a period of time",
    });
  }
});
/* This is a route handler for the /api/organizations/stats endpoint. It is using the
  period and aggregation query parameters to determine the period of time and the aggregation level
  to use when querying the database. */
router.get("/organizations/stats", async (req, res) => {
  let { period, aggregation } = req.query;
  /* Checking if aggregation is set, if it is not set, it will set aggregation to month. */
  aggregation = !aggregation ? "month" : aggregation;

  if (period) {
    /* Split the period variable into an array. */
    const periodArray = period.split("_");
    /* A switch statement that is checking the aggregation parameter.
    Depending on the aggregation parameter, the code will call the appropriate function to
    get the data from the database. */
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
  } /* The above code is checking to see if the user has specified a period of time. If they have, it
  will return the data for that period of time. If they have not, it will return an error message. */ else {
    res.status(400).json({
      success: false,
      message: "Please specifiy a period of time",
    });
  }
});

export default router;
