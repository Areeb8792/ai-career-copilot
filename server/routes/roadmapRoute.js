// server/routes/roadmapRoutes.js
const express = require("express");
const router = express.Router();

router.post("/generate-roadmap", (req, res) => {
  const { goal } = req.body;

  // Dummy roadmap for now
  const roadmap = [
    "Learn HTML & CSS",
    "Build Landing Page",
    "Learn JavaScript",
    "Learn React",
    "Learn Node.js"
  ];

  res.json({ roadmap });
});

module.exports = router;