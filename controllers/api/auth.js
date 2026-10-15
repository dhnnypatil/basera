/**
 * REST API - Authentication.
 * The API uses the same session cookie as the website: log in once, and the cookie
 * is sent automatically with every following request (Postman / Thunder Client do this too).
 *
 *   POST /api/auth/signup   -> create an account (and log in)   201 Created
 *   POST /api/auth/login    -> log in                           200 OK / 401 Unauthorized
 *   POST /api/auth/logout   -> log out                          204 No Content
 *   GET  /api/auth/me       -> who am I?                        200 OK
 */
const passport = require("passport");
const authService = require("../../services/authService.js");
const ExpressError = require("../../utils/ExpressError.js");

module.exports.signup = async (req, res, next) => {
    const user = await authService.registerUser(req.body);
    req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user: user.toPublicJSON() });
    });
};

module.exports.login = (req, res, next) => {
    passport.authenticate("local", (err, user) => {
        if (err) return next(err);
        if (!user) return next(new ExpressError(401, "Invalid username or password."));

        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            res.status(200).json({ user: user.toPublicJSON() });
        });
    })(req, res, next);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.status(204).end();
    });
};

module.exports.me = (req, res) => {
    res.status(200).json({ user: req.user.toPublicJSON() });
};
