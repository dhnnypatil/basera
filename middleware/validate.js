const ExpressError = require("../utils/ExpressError.js");
const { isApiRequest } = require("../utils/helpers.js");

/**
 * Builds a middleware that validates req.body against a Joi schema.
 *
 *   router.post("/", validate(listingSchema), controller.create)
 *
 * On success, req.body is replaced with the cleaned value (strings converted to numbers/dates,
 * unknown fields removed - so nobody can sneak in fields like `owner` or `totalPrice`).
 * On failure:
 *   - API request  -> 400 Bad Request JSON (via the error handler)
 *   - Web form     -> flash the message and send the user back to the form
 */
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,  // report every problem, not just the first one
            stripUnknown: true, // drop fields we didn't ask for
        });

        if (error) {
            // '"listing.price" must be ...'  ->  'price must be ...'
            const message = error.details
                .map((detail) => detail.message.replace(/"/g, "").replace(/^\w+\./, ""))
                .join(", ");
            if (isApiRequest(req)) return next(new ExpressError(400, message));
            req.flash("error", message);
            return res.redirect("back");
        }

        req.body = value;
        next();
    };
}

module.exports = validate;
