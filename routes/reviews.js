/**
 * Review routes are nested under a listing:  /listings/:id/reviews
 *
 *   POST     /listings/:id/reviews              -> create   (customers only)
 *   DELETE   /listings/:id/reviews/:reviewId    -> destroy  (review author only)
 */
const express = require("express");
const router = express.Router({ mergeParams: true }); // lets us read :id from the parent path in app.js
const wrapAsync = require("../utils/wrapAsync.js");
const validate = require("../middleware/validate.js");
const { isLoggedIn, isCustomer, isReviewAuthor } = require("../middleware/auth.js");
const { reviewSchema } = require("../validators/schemas.js");
const reviewController = require("../controllers/reviews.js");

router.post("/", isLoggedIn, isCustomer, validate(reviewSchema), wrapAsync(reviewController.create));
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroy));

module.exports = router;
