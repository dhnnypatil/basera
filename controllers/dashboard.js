const listingService = require("../services/listingService.js");
const bookingService = require("../services/bookingService.js");
const { BOOKING_STATUS } = require("../utils/constants.js");

// GET /dashboard - the host's home: their listings, bookings received, and quick stats
module.exports.hostDashboard = async (req, res) => {
    const listings = await listingService.getListingsByOwner(req.user._id);
    const bookings = await bookingService.getBookingsForHost(req.user._id);

    const confirmed = bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED);
    const stats = {
        totalListings: listings.length,
        upcomingBookings: confirmed.filter((b) => b.isUpcoming).length,
        // Hosts earn nights x nightly price (the service fee goes to the platform).
        totalEarnings: confirmed.reduce((sum, b) => sum + b.nights * b.pricePerNight, 0),
    };
    res.render("dashboard/index.ejs", { listings, bookings, stats });
};
