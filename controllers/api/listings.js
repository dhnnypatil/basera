/**
 * REST API - Listings.  Every handler responds with JSON and a meaningful HTTP status code.
 *
 *   GET    /api/listings        -> index    (Read all)    200 OK
 *   GET    /api/listings/:id    -> show     (Read one)    200 OK / 404 Not Found
 *   POST   /api/listings        -> create   (Create)      201 Created
 *   PUT    /api/listings/:id    -> update   (Update)      200 OK
 *   DELETE /api/listings/:id    -> destroy  (Delete)      204 No Content
 */
const listingService = require("../../services/listingService.js");
const { fileToImage } = require("../../config/upload.js");

module.exports.index = async (req, res) => {
    const listings = await listingService.searchListings(req.query);
    res.status(200).json({ count: listings.length, listings });
};

module.exports.show = async (req, res) => {
    const listing = await listingService.getListingById(req.params.id);
    res.status(200).json({ listing });
};

module.exports.create = async (req, res) => {
    const listing = await listingService.createListing(req.body.listing, req.user._id, fileToImage(req.file));
    res.status(201).location(`/api/listings/${listing._id}`).json({ listing });
};

module.exports.update = async (req, res) => {
    const listing = await listingService.updateListing(req.listing, req.body.listing, fileToImage(req.file));
    res.status(200).json({ listing });
};

module.exports.destroy = async (req, res) => {
    await listingService.deleteListing(req.params.id);
    res.status(204).end();
};
