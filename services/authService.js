/**
 * Account logic - signing up new users.
 * (Logging in is handled by Passport; see config/passport.js and controllers/users.js.)
 */
const User = require("../models/user.js");
const ExpressError = require("../utils/ExpressError.js");

/** CREATE - registers a user. passport-local-mongoose hashes the password for us. */
async function registerUser({ username, email, password, role }) {
    const emailTaken = await User.exists({ email: email.toLowerCase() });
    if (emailTaken) throw new ExpressError(409, "An account with that email already exists.");

    try {
        return await User.register(new User({ username, email, role }), password);
    } catch (err) {
        if (err.name === "UserExistsError") throw new ExpressError(409, "That username is already taken.");
        throw err;
    }
}

module.exports = { registerUser };
