/**
 *   GET     /api/listings       public       Read all  (supports ?q=&category=&minPrice=&maxPrice=&guests=&checkIn=&checkOut=&sort=)
 *   GET     /api/listings/:id   public       Read one
 *   POST    /api/listings       host         Create
 *   PUT     /api/listings/:id   owner        Update
 *   DELETE  /api/listings/:id   owner        Delete
 */
const express = require("express");
const router = express.Router();
const wrapAsync = require("../../utils/wrapAsync.js");
const validate = require("../../middleware/validate.js");
const { isLoggedIn, isHost, isListingOwner } = require("../../middleware/auth.js");
const { listingSchema } = require("../../validators/schemas.js");
const { upload } = require("../../config/upload.js");
const listingsApi = require("../../controllers/api/listings.js");

router.route("/")
    .get(wrapAsync(listingsApi.index))
    .post(isLoggedIn, isHost, upload.single("image"), validate(listingSchema), wrapAsync(listingsApi.create));

router.route("/:id")
    .get(wrapAsync(listingsApi.show))
    .put(isLoggedIn, isListingOwner, upload.single("image"), validate(listingSchema), wrapAsync(listingsApi.update))
    .delete(isLoggedIn, isListingOwner, wrapAsync(listingsApi.destroy));

module.exports = router;
