const listingService = require("../services/listingService.js");

// GET / - landing page
module.exports.home = async (req, res) => {
    const featuredListings = await listingService.getFeaturedListings(8);
    res.render("pages/home.ejs", { featuredListings });
};
