/**
 * Website routes for bookings.
 *
 *   GET      /bookings            -> index           my trips (customer)
 *   POST     /bookings            -> create          book a place (customer)
 *   GET      /bookings/:id/edit   -> renderEditForm  change dates (the guest)
 *   PUT      /bookings/:id        -> update          (the guest)
 *   DELETE   /bookings/:id        -> cancel          (the guest OR the listing's host)
 */
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const validate = require("../middleware/validate.js");
const { isLoggedIn, isCustomer, canAccessBooking, isBookingGuest } = require("../middleware/auth.js");
const { bookingSchema } = require("../validators/schemas.js");
const bookingController = require("../controllers/bookings.js");

// Every booking route needs a logged-in user.
router.use(isLoggedIn);

router.route("/")
    .get(isCustomer, wrapAsync(bookingController.index))
    .post(isCustomer, validate(bookingSchema), wrapAsync(bookingController.create));

router.route("/:id")
    .put(canAccessBooking, isBookingGuest, validate(bookingSchema), wrapAsync(bookingController.update))
    .delete(canAccessBooking, wrapAsync(bookingController.cancel));

router.get("/:id/edit", canAccessBooking, isBookingGuest, bookingController.renderEditForm);

module.exports = router;
