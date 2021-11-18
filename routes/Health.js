import express from "express";

const router = express.Router();

router.get("/healthcheck", async (req, res) => {
  res.status(200).json({
    message: "I'm alive, freedom!!!!",
  });
});

export default router;
