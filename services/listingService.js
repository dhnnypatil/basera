/**
 * Listing business logic.
 *
 * Both the website controllers (controllers/listings.js) and the API controllers
 * (controllers/api/listings.js) call these functions, so the rules live in exactly one place.
 * Services never touch req/res - they take plain values and return data (or throw ExpressError).
 */
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const ExpressError = require("../utils/ExpressError.js");
const geocode = require("../utils/geocode.js");
const { BOOKING_STATUS } = require("../utils/constants.js");

const SORT_OPTIONS = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
};

const FILTER_KEYS = ["q", "category", "minPrice", "maxPrice", "guests", "checkIn", "checkOut", "sort"];

/** Escapes characters that have special meaning in a regular expression. */
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Keeps only known, non-empty, plain-string filters from a query string.
 * This blocks NoSQL injection like ?category[$ne]=x (which Express would parse into an object).
 */
function cleanFilters(raw = {}) {
    const filters = {};
    for (const key of FILTER_KEYS) {
        if (typeof raw[key] === "string" && raw[key].trim() !== "") filters[key] = raw[key].trim();
    }
    for (const key of ["minPrice", "maxPrice", "guests"]) {
        if (filters[key] && Number.isNaN(Number(filters[key]))) delete filters[key];
    }
    const validDates = !Number.isNaN(Date.parse(filters.checkIn)) && !Number.isNaN(Date.parse(filters.checkOut));
    if (!validDates || new Date(filters.checkOut) <= new Date(filters.checkIn)) {
        delete filters.checkIn;
        delete filters.checkOut;
    }
    return filters;
}

/**
 * READ (many) - search listings with optional filters.
 *
 * @param {Object} filters - all optional:
 *   q          text to match in title / location / country
 *   category   one of CATEGORY_NAMES
 *   minPrice, maxPrice   price-per-night range
 *   guests     minimum guest capacity
 *   checkIn, checkOut    only return listings free for these dates
 *   sort       "newest" | "price_asc" | "price_desc" | "rating"
 */
async function searchListings(rawFilters = {}) {
    const filters = cleanFilters(rawFilters);
    const query = {};

    if (filters.q) {
        const pattern = new RegExp(escapeRegex(filters.q.trim()), "i");
        query.$or = [{ title: pattern }, { location: pattern }, { country: pattern }];
    }
    if (filters.category) query.category = filters.category;
    if (filters.guests) query.maxGuests = { $gte: Number(filters.guests) };

    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
        if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
    }

    // Availability: hide listings that already have a booking overlapping the requested dates.
    if (filters.checkIn && filters.checkOut) {
        const bookedListingIds = await Booking.distinct("listing", {
            status: BOOKING_STATUS.CONFIRMED,
            checkIn: { $lt: new Date(filters.checkOut) },
            checkOut: { $gt: new Date(filters.checkIn) },
        });
        query._id = { $nin: bookedListingIds };
    }

    const sort = SORT_OPTIONS[filters.sort] || SORT_OPTIONS.newest;
    const listings = await Listing.find(query).sort(sort).populate("reviews", "rating");

    // Rating is calculated from reviews (a virtual), so it can't be sorted in the database query.
    if (filters.sort === "rating") {
        listings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return listings;
}

/** READ (many) - the best-rated listings, for the home page. */
async function getFeaturedListings(limit = 8) {
    const listings = await searchListings({ sort: "rating" });
    return listings.slice(0, limit);
}

/** READ (many) - all listings owned by one host, for the host dashboard. */
function getListingsByOwner(ownerId) {
    return Listing.find({ owner: ownerId }).sort({ createdAt: -1 }).populate("reviews", "rating");
}

/** READ (one) - a single listing with its owner and reviews (and each review's author). */
async function getListingById(id) {
    const listing = await Listing.findById(id)
        .populate("owner", "username createdAt")
        .populate({ path: "reviews", populate: { path: "author", select: "username" }, options: { sort: { createdAt: -1 } } });

    if (!listing) throw new ExpressError(404, "Listing not found.");
    return listing;
}

/**
 * CREATE - a new listing owned by `ownerId`.
 * @param {Object} data  - validated listing fields
 * @param {Object|null} image - { url, filename } from an uploaded file, if any
 */
async function createListing(data, ownerId, image) {
    const listing = new Listing({ ...data, owner: ownerId });
    if (image) listing.image = image;

    const geometry = await geocode(`${data.location}, ${data.country}`);
    if (geometry) listing.geometry = geometry;

    return listing.save();
}

/**
 * UPDATE - change an existing listing (ownership is already checked by middleware).
 * Re-geocodes only if the address changed.
 */
async function updateListing(listing, data, image) {
    const addressChanged = data.location !== listing.location || data.country !== listing.country;

    // Keep the current image if no new image (file or URL) was provided.
    const { image: imageFromBody, ...fields } = data;
    listing.set(fields);
    if (image) listing.image = image;
    else if (imageFromBody && imageFromBody.url) listing.image = { url: imageFromBody.url };

    if (addressChanged) {
        const geometry = await geocode(`${data.location}, ${data.country}`);
        listing.geometry = geometry || undefined;
    }
    return listing.save();
}

/** DELETE - removes the listing. Its reviews and bookings are removed by the model's post hook. */
async function deleteListing(id) {
    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) throw new ExpressError(404, "Listing not found.");
    return deleted;
}

module.exports = {
    cleanFilters,
    searchListings,
    getFeaturedListings,
    getListingsByOwner,
    getListingById,
    createListing,
    updateListing,
    deleteListing,
};
