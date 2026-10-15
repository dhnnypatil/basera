/**
 * Shared constants used by models, validators and views.
 * Keeping them in one place means the dropdowns, filters and database rules never disagree.
 */

// A user signs up as one of these (like Unstop's "Candidate" / "Recruiter").
const ROLES = {
    HOST: "host",         // the "admin" side: lists and manages places
    CUSTOMER: "customer", // rents places
};

// Listing categories + the Font Awesome icon shown for each.
const CATEGORIES = [
    { name: "Rooms", icon: "fa-solid fa-bed" },
    { name: "Iconic Cities", icon: "fa-solid fa-mountain-city" },
    { name: "Mountains", icon: "fa-solid fa-mountain" },
    { name: "Beach", icon: "fa-solid fa-umbrella-beach" },
    { name: "Castles", icon: "fa-brands fa-fort-awesome" },
    { name: "Camping", icon: "fa-solid fa-campground" },
    { name: "Pools", icon: "fa-solid fa-person-swimming" },
    { name: "Farmhouse", icon: "fa-solid fa-house-chimney-window" },
    { name: "Arctic", icon: "fa-regular fa-snowflake" },
    { name: "Treehouse", icon: "fa-solid fa-tree" },
];
const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

const BOOKING_STATUS = {
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
};

const SERVICE_FEE_RATE = 0.1; // 10% platform fee shown on the price breakdown

module.exports = { ROLES, CATEGORIES, CATEGORY_NAMES, BOOKING_STATUS, SERVICE_FEE_RATE };
