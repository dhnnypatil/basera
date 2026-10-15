/**
 * Signup / login / logout for the WEBSITE.
 *
 * Like Unstop's "Candidate / Recruiter" login, the forms have two tabs:
 *   Customer -> rents places        Host (admin) -> lists & manages places
 * The selected tab is sent as `role`. At login we check the account really has that role.
 */
const passport = require("passport");
const authService = require("../services/authService.js");
const { ROLES } = require("../utils/constants.js");

/** Where to send a user after they log in / sign up. */
function homeFor(user) {
    return user.role === ROLES.HOST ? "/dashboard" : "/listings";
}

/** Reads ?role=host from the URL so the right tab is pre-selected. */
function selectedRole(req) {
    return req.query.role === ROLES.HOST ? ROLES.HOST : ROLES.CUSTOMER;
}

// GET /signup
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs", { role: selectedRole(req) });
};

// POST /signup - CREATE a user, then log them straight in
module.exports.signup = async (req, res, next) => {
    const user = await authService.registerUser(req.body);
    req.login(user, (err) => {
        if (err) return next(err);
        req.flash("success", `Welcome to Basera, ${user.username}!`);
        res.redirect(homeFor(user));
    });
};

// GET /login
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs", { role: selectedRole(req) });
};

// POST /login
module.exports.login = (req, res, next) => {
    const role = req.body.role === ROLES.HOST ? ROLES.HOST : ROLES.CUSTOMER;

    passport.authenticate("local", (err, user) => {
        if (err) return next(err);

        if (!user) {
            req.flash("error", "Invalid username or password.");
            return res.redirect(`/login?role=${role}`);
        }
        if (user.role !== role) {
            const otherTab = user.role === ROLES.HOST ? "Host" : "Customer";
            req.flash("error", `This is a ${otherTab} account - please use the ${otherTab} tab to log in.`);
            return res.redirect(`/login?role=${user.role}`);
        }

        // Passport regenerates the session on login, so read returnTo before calling req.login.
        const returnTo = req.session.returnTo;
        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            req.flash("success", `Welcome back, ${user.username}!`);
            res.redirect(returnTo || homeFor(user));
        });
    })(req, res, next);
};

// POST /logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out.");
        res.redirect("/");
    });
};
