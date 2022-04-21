import express from "express";

const router = express.Router();

/* This is a route that will be used to check if the server is up and running. */
router.get("/healthcheck", async (req, res) => {
  res.status(200).json({
    message: "I'm alive, freedom!!!!",
  });
});

export default router;
