const reviewService = require("../services/reviewService.js");

// POST /listings/:id/reviews - CREATE
module.exports.create = async (req, res) => {
    await reviewService.createReview(req.params.id, req.user._id, req.body.review);
    req.flash("success", "Thanks for your review!");
    res.redirect(`/listings/${req.params.id}#reviews`);
};

// DELETE /listings/:id/reviews/:reviewId - DELETE
module.exports.destroy = async (req, res) => {
    const { id, reviewId } = req.params;
    await reviewService.deleteReview(id, reviewId);
    req.flash("success", "Review deleted.");
    res.redirect(`/listings/${id}#reviews`);
};
