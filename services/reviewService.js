/**
 * Review business logic.
 * Reviews are stored in their own collection; the listing keeps an array of review ids.
 */
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");

/** CREATE - adds a review to a listing. */
async function createReview(listingId, authorId, data) {
    const listing = await Listing.findById(listingId);
    if (!listing) throw new ExpressError(404, "Listing not found.");
    if (listing.owner.equals(authorId)) throw new ExpressError(400, "You can't review your own listing.");

    const review = await Review.create({ ...data, author: authorId });
    listing.reviews.push(review._id);
    await listing.save();
    return review;
}

/** DELETE - removes the review and its id from the listing's reviews array. */
async function deleteReview(listingId, reviewId) {
    await Listing.findByIdAndUpdate(listingId, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
}

module.exports = { createReview, deleteReview };
