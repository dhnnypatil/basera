/**
 * REST API - Bookings.
 *
 *   GET    /api/bookings       -> index    (Read all)  customer: my trips / host: bookings on my listings
 *   GET    /api/bookings/:id   -> show     (Read one)
 *   POST   /api/bookings       -> create   (Create)    201 Created / 409 Conflict if dates are taken
 *   PUT    /api/bookings/:id   -> update   (Update)    change dates / guests
 *   DELETE /api/bookings/:id   -> cancel   (Delete)    soft delete: status becomes "cancelled"
 */
const bookingService = require("../../services/bookingService.js");
const { ROLES } = require("../../utils/constants.js");

module.exports.index = async (req, res) => {
    const bookings =
        req.user.role === ROLES.HOST
            ? await bookingService.getBookingsForHost(req.user._id)
            : await bookingService.getBookingsForGuest(req.user._id);
    res.status(200).json({ count: bookings.length, bookings });
};

module.exports.show = (req, res) => {
    res.status(200).json({ booking: req.booking });
};

module.exports.create = async (req, res) => {
    const { listing, checkIn, checkOut, guests } = req.body.booking;
    const booking = await bookingService.createBooking({ listingId: listing, guestId: req.user._id, checkIn, checkOut, guests });
    res.status(201).location(`/api/bookings/${booking._id}`).json({ booking });
};

module.exports.update = async (req, res) => {
    const booking = await bookingService.updateBooking(req.booking, req.body.booking);
    res.status(200).json({ booking });
};

module.exports.cancel = async (req, res) => {
    const booking = await bookingService.cancelBooking(req.booking);
    res.status(200).json({ booking });
};
