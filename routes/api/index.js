/**
 * JSON REST API - everything under /api.
 * Full documentation with example requests: docs/API.md
 */
const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.js"));
router.use("/listings", require("./listings.js"));
router.use("/bookings", require("./bookings.js"));

module.exports = router;
