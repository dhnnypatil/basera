/**
 *   GET     /api/bookings       logged in             Read all (yours)
 *   GET     /api/bookings/:id   guest or host         Read one
 *   POST    /api/bookings       customer              Create
 *   PUT     /api/bookings/:id   guest                 Update
 *   DELETE  /api/bookings/:id   guest or host         Delete (cancel)
 */
const express = require("express");
const router = express.Router();
const wrapAsync = require("../../utils/wrapAsync.js");
const validate = require("../../middleware/validate.js");
const { isLoggedIn, isCustomer, canAccessBooking, isBookingGuest } = require("../../middleware/auth.js");
const { bookingSchema } = require("../../validators/schemas.js");
const bookingsApi = require("../../controllers/api/bookings.js");

router.use(isLoggedIn);

router.route("/")
    .get(wrapAsync(bookingsApi.index))
    .post(isCustomer, validate(bookingSchema), wrapAsync(bookingsApi.create));

router.route("/:id")
    .get(canAccessBooking, bookingsApi.show)
    .put(canAccessBooking, isBookingGuest, validate(bookingSchema), wrapAsync(bookingsApi.update))
    .delete(canAccessBooking, wrapAsync(bookingsApi.cancel));

module.exports = router;
