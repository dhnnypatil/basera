/**
 * Passport setup (authentication).
 *
 * passport-local-mongoose adds username + hashed password fields to the User model
 * and gives us ready-made authenticate / serialize / deserialize helpers.
 */
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/user.js");

passport.use(new LocalStrategy(User.authenticate()));

// serialize = what we store in the session (the user id)
// deserialize = turning that id back into a full user object on every request (req.user)
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports = passport;
