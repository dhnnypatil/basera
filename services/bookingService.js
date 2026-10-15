/**
 * Booking business logic - shared by the website and the API.
 *
 * Rules enforced here:
 *   1. You can't book dates in the past.
 *   2. You can't book more guests than the listing allows.
 *   3. A host can't book their own listing.
 *   4. Two confirmed bookings for the same listing can never overlap (409 Conflict).
 *   5. Price = nights x price-per-night + service fee, calculated on the server (never trusted from the client).
 */
const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const { todayISO } = require("../utils/helpers.js");
const { BOOKING_STATUS, SERVICE_FEE_RATE } = require("../utils/constants.js");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Works out the price breakdown for a stay. */
function calculatePrice(pricePerNight, checkIn, checkOut) {
    const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / MS_PER_DAY);
    const subtotal = nights * pricePerNight;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
    return { nights, subtotal, serviceFee, total: subtotal + serviceFee };
}

/** Throws a 400/409 error if the requested stay breaks any booking rule. */
async function assertBookable(listing, { checkIn, checkOut, guests }, ignoreBookingId) {
    if (new Date(checkIn) < new Date(todayISO())) {
        throw new ExpressError(400, "Check-in date can't be in the past.");
    }
    if (guests > listing.maxGuests) {
        throw new ExpressError(400, `This place allows at most ${listing.maxGuests} guests.`);
    }
    const clashes = await Booking.findOverlapping(listing._id, checkIn, checkOut, ignoreBookingId);
    if (clashes.length > 0) {
        throw new ExpressError(409, "Sorry, those dates are already booked. Please pick different dates.");
    }
}

/** CREATE - a customer books a listing. */
async function createBooking({ listingId, guestId, checkIn, checkOut, guests }) {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new ExpressError(404, "Listing not found.");
    if (listing.owner.equals(guestId)) throw new ExpressError(400, "You can't book your own listing.");

    await assertBookable(listing, { checkIn, checkOut, guests });

    const { total } = calculatePrice(listing.price, checkIn, checkOut);
    return Booking.create({
        listing: listing._id,
        guest: guestId,
        checkIn,
        checkOut,
        guests,
        pricePerNight: listing.price,
        totalPrice: total,
    });
}

/** READ (many) - a customer's trips, newest check-in first. */
function getBookingsForGuest(guestId) {
    return Booking.find({ guest: guestId })
        .sort({ checkIn: -1 })
        .populate("listing", "title location country image price");
}

/** READ (many) - every booking made on any of a host's listings. */
async function getBookingsForHost(hostId) {
    const listingIds = await Listing.find({ owner: hostId }).distinct("_id");
    return Booking.find({ listing: { $in: listingIds } })
        .sort({ checkIn: -1 })
        .populate("listing", "title location image")
        .populate("guest", "username email");
}

/** READ - date ranges already taken for a listing (shown on the listing page). */
function getUpcomingBookedRanges(listingId) {
    return Booking.find({
        listing: listingId,
        status: BOOKING_STATUS.CONFIRMED,
        checkOut: { $gt: new Date() },
    })
        .sort({ checkIn: 1 })
        .select("checkIn checkOut");
}

/** UPDATE - the guest changes dates or number of guests. Price is recalculated. */
async function updateBooking(booking, { checkIn, checkOut, guests }) {
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
        throw new ExpressError(400, "A cancelled booking can't be changed.");
    }
    const listing = booking.listing._id ? booking.listing : await Listing.findById(booking.listing);
    await assertBookable(listing, { checkIn, checkOut, guests }, booking._id);

    booking.set({ checkIn, checkOut, guests });
    booking.totalPrice = calculatePrice(booking.pricePerNight, checkIn, checkOut).total;
    return booking.save();
}

/**
 * DELETE - cancels a booking.
 * This is a "soft delete": we keep the record but mark it cancelled, so both the guest
 * and the host still have a history of it. (Listings, by contrast, are hard-deleted.)
 */
async function cancelBooking(booking) {
    if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new ExpressError(400, "This booking is already cancelled.");
    }
    booking.status = BOOKING_STATUS.CANCELLED;
    return booking.save();
}

module.exports = {
    calculatePrice,
    createBooking,
    getBookingsForGuest,
    getBookingsForHost,
    getUpcomingBookedRanges,
    updateBooking,
    cancelBooking,
};
