/**
 * Website routes for listings - RESTful URL design:
 *
 *   Method   Path                  Middleware chain                    Controller      CRUD
 *   GET      /listings             -                                   index           Read all
 *   GET      /listings/new         loggedIn, host                      renderNewForm   (form)
 *   POST     /listings             loggedIn, host, upload, validate    create          Create
 *   GET      /listings/:id         -                                   show            Read one
 *   GET      /listings/:id/edit    loggedIn, owner                     renderEditForm  (form)
 *   PUT      /listings/:id         loggedIn, owner, upload, validate   update          Update
 *   DELETE   /listings/:id         loggedIn, owner                     destroy         Delete
 *
 * HTML forms can only send GET/POST, so PUT/DELETE forms use ?_method=PUT (method-override).
 */
const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const validate = require("../middleware/validate.js");
const { isLoggedIn, isHost, isListingOwner } = require("../middleware/auth.js");
const { listingSchema } = require("../validators/schemas.js");
const { upload } = require("../config/upload.js");
const listingController = require("../controllers/listings.js");

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, isHost, upload.single("image"), validate(listingSchema), wrapAsync(listingController.create));

// "/new" must come before "/:id", otherwise Express would treat "new" as an id.
router.get("/new", isLoggedIn, isHost, listingController.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.show))
    .put(isLoggedIn, isListingOwner, upload.single("image"), validate(listingSchema), wrapAsync(listingController.update))
    .delete(isLoggedIn, isListingOwner, wrapAsync(listingController.destroy));

router.get("/:id/edit", isLoggedIn, isListingOwner, listingController.renderEditForm);

module.exports = router;
