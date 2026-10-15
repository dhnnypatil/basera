const mongoose = require("mongoose");
const Review = require("./review.js");
const Booking = require("./booking.js");
const { CATEGORY_NAMES } = require("../utils/constants.js");

const DEFAULT_IMAGE_URL =
    "https://images.unsplash.com/photo-1710609942195-b9dab8f48fc6?q=80&w=1200&auto=format&fit=crop";

const listingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            filename: String,
            url: {
                type: String,
                default: DEFAULT_IMAGE_URL,
                set: (v) => (v ? v : DEFAULT_IMAGE_URL), // empty string -> default image
            },
        },
        price: {
            // price per night, in rupees
            type: Number,
            required: true,
            min: 0,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: CATEGORY_NAMES,
            default: "Rooms",
        },
        maxGuests: {
            type: Number,
            min: 1,
            default: 2,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reviews: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        // GeoJSON point used to draw the map. Optional: if geocoding fails we simply hide the map.
        geometry: {
            type: {
                type: String,
                enum: ["Point"],
            },
            coordinates: [Number], // [longitude, latitude]
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/**
 * Average star rating. Only works when `reviews` has been populated
 * (otherwise we just have ids, not ratings) - returns null if there are no reviews.
 */
listingSchema.virtual("averageRating").get(function () {
    const ratings = (this.reviews || []).map((r) => r && r.rating).filter(Boolean);
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((total, r) => total + r, 0);
    return Math.round((sum / ratings.length) * 100) / 100;
});

/** Cascade delete: when a listing is deleted, delete its reviews and bookings too. */
listingSchema.post("findOneAndDelete", async (listing) => {
    if (!listing) return;
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ listing: listing._id });
});

module.exports = mongoose.model("Listing", listingSchema);
