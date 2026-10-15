const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isHost } = require("../middleware/auth.js");
const dashboardController = require("../controllers/dashboard.js");

// GET /dashboard - hosts only
router.get("/", isLoggedIn, isHost, wrapAsync(dashboardController.hostDashboard));

module.exports = router;
