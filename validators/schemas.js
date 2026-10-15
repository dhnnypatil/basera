/**
 * Request body validation rules (Joi).
 *
 * These run BEFORE the controller (see middleware/validate.js). They protect the database from
 * bad data even if someone skips the HTML form and sends requests directly (e.g. with Postman).
 *
 * Every body is wrapped in the resource name, e.g. { listing: {...} }, { booking: {...} }.
 * HTML forms produce this shape with names like `listing[title]`, and the JSON API uses the same shape.
 */
const Joi = require("joi");
const { CATEGORY_NAMES, ROLES } = require("../utils/constants.js");

const objectId = Joi.string().hex().length(24);

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().trim().max(100).required(),
        description: Joi.string().trim().max(2000).allow(""),
        location: Joi.string().trim().required(),
        country: Joi.string().trim().required(),
        price: Joi.number().min(0).required(),
        category: Joi.string().valid(...CATEGORY_NAMES).required(),
        maxGuests: Joi.number().integer().min(1).max(20).default(2),
        image: Joi.object({
            url: Joi.string().uri().allow(""),
        }),
    }).required(),
});

const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required(),
        comment: Joi.string().trim().max(1000).required(),
    }).required(),
});

const bookingSchema = Joi.object({
    booking: Joi.object({
        listing: objectId, // required when creating, ignored when updating
        checkIn: Joi.date().iso().required(),
        checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required().messages({
            "date.greater": "Check-out must be after check-in",
        }),
        guests: Joi.number().integer().min(1).max(20).default(1),
    }).required(),
});

const signupSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
});

module.exports = { listingSchema, reviewSchema, bookingSchema, signupSchema };
