/**
 * Listing controllers for the WEBSITE (they render EJS pages / redirect).
 * The JSON versions live in controllers/api/listings.js - both call services/listingService.js.
 */
const listingService = require("../services/listingService.js");
const bookingService = require("../services/bookingService.js");
const { fileToImage } = require("../config/upload.js");

// GET /listings - READ all (with search & filters from the query string)
module.exports.index = async (req, res) => {
    const filters = listingService.cleanFilters(req.query);
    const listings = await listingService.searchListings(filters);

    // If dates were picked, show the total for the whole stay on each card.
    let nights = 0;
    if (filters.checkIn && filters.checkOut) {
        nights = bookingService.calculatePrice(0, filters.checkIn, filters.checkOut).nights;
    }
    res.render("listings/index.ejs", { listings, filters, nights });
};

// GET /listings/new - form to CREATE
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// POST /listings - CREATE
module.exports.create = async (req, res) => {
    const listing = await listingService.createListing(req.body.listing, req.user._id, fileToImage(req.file));
    req.flash("success", "Your place is live! 🎉");
    res.redirect(`/listings/${listing._id}`);
};

// GET /listings/:id - READ one
module.exports.show = async (req, res) => {
    const listing = await listingService.getListingById(req.params.id);
    const bookedRanges = await bookingService.getUpcomingBookedRanges(listing._id);

    const isOwner = Boolean(req.user && listing.owner._id.equals(req.user._id));
    res.render("listings/show.ejs", { listing, bookedRanges, isOwner });
};

// GET /listings/:id/edit - form to UPDATE (req.listing was loaded by the isListingOwner middleware)
module.exports.renderEditForm = (req, res) => {
    res.render("listings/edit.ejs", { listing: req.listing });
};

// PUT /listings/:id - UPDATE
module.exports.update = async (req, res) => {
    await listingService.updateListing(req.listing, req.body.listing, fileToImage(req.file));
    req.flash("success", "Listing updated.");
    res.redirect(`/listings/${req.params.id}`);
};

// DELETE /listings/:id - DELETE
module.exports.destroy = async (req, res) => {
    await listingService.deleteListing(req.params.id);
    req.flash("success", "Listing deleted.");
    res.redirect("/dashboard");
};
