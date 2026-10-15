const mongoose = require("mongoose");
const { BOOKING_STATUS } = require("../utils/constants.js");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const bookingSchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        guest: {
            // the customer who made the booking
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        guests: {
            type: Number,
            min: 1,
            default: 1,
        },
        pricePerNight: {
            // copied from the listing at booking time, so later price changes don't affect old bookings
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
            default: BOOKING_STATUS.CONFIRMED,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

bookingSchema.virtual("nights").get(function () {
    return Math.round((this.checkOut - this.checkIn) / MS_PER_DAY);
});

bookingSchema.virtual("isUpcoming").get(function () {
    return this.status === BOOKING_STATUS.CONFIRMED && this.checkOut > new Date();
});

/**
 * Two stays overlap when one starts before the other ends.
 * Check-out day can be someone else's check-in day, so we use strict < and >.
 *
 * @param {ObjectId} listingId
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {ObjectId} [ignoreBookingId] - skip this booking (used when editing an existing one)
 */
bookingSchema.statics.findOverlapping = function (listingId, checkIn, checkOut, ignoreBookingId) {
    const query = {
        listing: listingId,
        status: BOOKING_STATUS.CONFIRMED,
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
    };
    if (ignoreBookingId) query._id = { $ne: ignoreBookingId };
    return this.find(query);
};

module.exports = mongoose.model("Booking", bookingSchema);
