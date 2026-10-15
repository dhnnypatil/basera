/**
 * Booking controllers for the WEBSITE.
 * The JSON versions live in controllers/api/bookings.js - both call services/bookingService.js.
 */
const bookingService = require("../services/bookingService.js");

// GET /bookings - READ all of the logged-in customer's trips
module.exports.index = async (req, res) => {
    const bookings = await bookingService.getBookingsForGuest(req.user._id);
    const upcoming = bookings.filter((b) => b.isUpcoming);
    const past = bookings.filter((b) => !b.isUpcoming);
    res.render("bookings/index.ejs", { upcoming, past });
};

// POST /bookings - CREATE (the listing id comes from a hidden field in the booking form)
module.exports.create = async (req, res) => {
    const { listing, checkIn, checkOut, guests } = req.body.booking;
    await bookingService.createBooking({ listingId: listing, guestId: req.user._id, checkIn, checkOut, guests });
    req.flash("success", "Booking confirmed! Have a great stay.");
    res.redirect("/bookings");
};

// GET /bookings/:id/edit - form to UPDATE (req.booking was loaded by the canAccessBooking middleware)
module.exports.renderEditForm = (req, res) => {
    res.render("bookings/edit.ejs", { booking: req.booking });
};

// PUT /bookings/:id - UPDATE dates / guests
module.exports.update = async (req, res) => {
    await bookingService.updateBooking(req.booking, req.body.booking);
    req.flash("success", "Booking updated.");
    res.redirect("/bookings");
};

// DELETE /bookings/:id - DELETE (cancel). Guests go back to their trips, hosts to their dashboard.
module.exports.cancel = async (req, res) => {
    await bookingService.cancelBooking(req.booking);
    req.flash("success", "Booking cancelled.");
    res.redirect(req.isBookingGuest ? "/bookings" : "/dashboard");
};
