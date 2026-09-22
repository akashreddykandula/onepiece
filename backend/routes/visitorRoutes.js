"use strict";

const express = require("express");
const router = express.Router();

const {
  registerVisitor,
  getVisitorCount,
} = require("../controllers/visitorController");

router.post("/register", registerVisitor);
router.get("/count", getVisitorCount);

module.exports = router;
