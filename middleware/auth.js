/**
 * Authentication & authorization middleware.
 *
 *   Authentication = "who are you?"            -> isLoggedIn
 *   Authorization  = "are you allowed to do this?" -> isHost, isCustomer, isListingOwner, ...
 *
 * Each check works for both halves of the app:
 *   - Website: flash a message and redirect.
 *   - JSON API: respond with 401 Unauthorized / 403 Forbidden / 404 Not Found.
 */
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { isApiRequest } = require("../utils/helpers.js");
const { ROLES } = require("../utils/constants.js");

/** Rejects the request in the right format for the website or the API. */
function deny(req, res, next, status, message, redirectTo) {
    if (isApiRequest(req)) return next(new ExpressError(status, message));
    req.flash("error", message);
    return res.redirect(redirectTo);
}

module.exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();

    // Remember where the user was going so we can send them back after login.
    if (req.method === "GET") req.session.returnTo = req.originalUrl;
    return deny(req, res, next, 401, "Please log in first.", "/login");
};

/** Only lets through users with the given role. Use after isLoggedIn. */
function requireRole(role, message) {
    return (req, res, next) => {
        if (req.user.role === role) return next();
        return deny(req, res, next, 403, message, "/listings");
    };
}

module.exports.isHost = requireRole(ROLES.HOST, "Only hosts can do that. Log in with a Host account.");
module.exports.isCustomer = requireRole(ROLES.CUSTOMER, "Only customers can do that. Log in with a Customer account.");

/**
 * Only the host who created a listing may edit/delete it.
 * (The original version forgot `await` and had its logic flipped, so ANY user could edit ANY listing.)
 * Stores the loaded listing on req.listing so the controller doesn't fetch it twice.
 */
module.exports.isListingOwner = wrapAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return deny(req, res, next, 404, "Listing not found.", "/listings");

    if (!listing.owner.equals(req.user._id)) {
        return deny(req, res, next, 403, "You are not the owner of this listing.", `/listings/${listing._id}`);
    }
    req.listing = listing;
    next();
});

module.exports.isReviewAuthor = wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return deny(req, res, next, 404, "Review not found.", `/listings/${id}`);

    if (!review.author.equals(req.user._id)) {
        return deny(req, res, next, 403, "You are not the author of this review.", `/listings/${id}`);
    }
    next();
});

/**
 * A booking can be seen/cancelled by two people: the customer who made it,
 * and the host who owns the listing. Sets req.booking and req.isBookingGuest.
 */
module.exports.canAccessBooking = wrapAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id).populate("listing");
    if (!booking) return deny(req, res, next, 404, "Booking not found.", "/bookings");

    const isGuest = booking.guest.equals(req.user._id);
    const isHostOfListing = booking.listing && booking.listing.owner.equals(req.user._id);
    if (!isGuest && !isHostOfListing) {
        return deny(req, res, next, 403, "You don't have access to this booking.", "/bookings");
    }
    req.booking = booking;
    req.isBookingGuest = isGuest;
    next();
});

/** Only the customer who made the booking may change its dates. Use after canAccessBooking. */
module.exports.isBookingGuest = (req, res, next) => {
    if (req.isBookingGuest) return next();
    return deny(req, res, next, 403, "Only the guest who made this booking can change it.", "/dashboard");
};
