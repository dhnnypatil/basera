const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const pagesController = require("../controllers/pages.js");

router.get("/", wrapAsync(pagesController.home));

module.exports = router;
