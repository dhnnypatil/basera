/**
 * Fills the database with demo users, listings, reviews and bookings.
 * WARNING: deletes all existing data first.
 *
 * Demo accounts (password for all: password123)
 *   Host:     demohost, priyahost
 *   Customer: democustomer, rahul
 */
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");
const sampleListings = require("./listings.js");
const { ROLES, BOOKING_STATUS } = require("../utils/constants.js");

const DEMO_PASSWORD = "password123";

const DEMO_USERS = [
    { username: "demohost", email: "host@basera.dev", role: ROLES.HOST },
    { username: "priyahost", email: "priya@basera.dev", role: ROLES.HOST },
    { username: "democustomer", email: "customer@basera.dev", role: ROLES.CUSTOMER },
    { username: "rahul", email: "rahul@basera.dev", role: ROLES.CUSTOMER },
];

const SAMPLE_REVIEWS = [
    { rating: 5, comment: "Absolutely loved it - spotless, great host and an unbeatable view." },
    { rating: 4, comment: "Lovely place and very comfortable. Check-in was a little slow." },
    { rating: 5, comment: "Exactly like the photos. Would book again in a heartbeat!" },
    { rating: 3, comment: "Good location, but the wifi was patchy." },
];

/** A date `days` from today, at midnight UTC (how all booking dates are stored). */
function daysFromNow(days) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
}

async function seedDatabase() {
    await Promise.all([User.deleteMany({}), Listing.deleteMany({}), Review.deleteMany({}), Booking.deleteMany({})]);

    // Users - User.register hashes the password.
    const users = {};
    for (const data of DEMO_USERS) {
        users[data.username] = await User.register(new User(data), DEMO_PASSWORD);
    }
    const hosts = [users.demohost, users.priyahost];
    const customers = [users.democustomer, users.rahul];

    // Listings - alternate between the two hosts.
    const listings = await Listing.insertMany(
        sampleListings.map((listing, i) => ({ ...listing, owner: hosts[i % hosts.length]._id }))
    );

    // Reviews - give roughly two thirds of the listings one or two reviews.
    for (const [i, listing] of listings.entries()) {
        if (i % 3 === 2) continue;
        const reviewCount = (i % 2) + 1;
        for (let r = 0; r < reviewCount; r++) {
            const review = await Review.create({
                ...SAMPLE_REVIEWS[(i + r) % SAMPLE_REVIEWS.length],
                author: customers[r % customers.length]._id,
            });
            listing.reviews.push(review._id);
        }
        await listing.save();
    }

    // Bookings - one upcoming and one past trip for democustomer, one upcoming for rahul.
    const makeBooking = (listing, guest, startDay, nights, status = BOOKING_STATUS.CONFIRMED) => ({
        listing: listing._id,
        guest: guest._id,
        checkIn: daysFromNow(startDay),
        checkOut: daysFromNow(startDay + nights),
        guests: 2,
        pricePerNight: listing.price,
        totalPrice: Math.round(listing.price * nights * 1.1), // nights x price + 10% service fee
        status,
    });
    await Booking.insertMany([
        makeBooking(listings[0], users.democustomer, 10, 3),
        makeBooking(listings[3], users.democustomer, -30, 2),
        makeBooking(listings[1], users.rahul, 5, 4),
    ]);

    console.log(`Seeded ${DEMO_USERS.length} users, ${listings.length} listings and 3 bookings.`);
    console.log(`Demo logins (password "${DEMO_PASSWORD}"): host -> demohost | customer -> democustomer`);
}

module.exports = { seedDatabase, DEMO_PASSWORD };
