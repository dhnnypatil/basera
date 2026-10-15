/**
 * Builds the Express application: settings -> middleware -> routes -> error handling.
 * The order matters - Express runs middleware top to bottom for every request.
 *
 * Starting the server (connecting to the DB, app.listen) happens in server.js.
 */
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("./config/passport.js");
const ExpressError = require("./utils/ExpressError.js");
const helpers = require("./utils/helpers.js");
const { CATEGORIES, ROLES, SERVICE_FEE_RATE } = require("./utils/constants.js");

const isProduction = process.env.NODE_ENV === "production";

function buildApp() {
    const app = express();

    // Hosts like Render sit behind a proxy that handles HTTPS. Trusting it lets Express
    // know the original request was HTTPS, which is required for secure cookies below.
    if (isProduction) app.set("trust proxy", 1);

    // ---------- 1. View engine (EJS + layouts) ----------
    app.engine("ejs", ejsMate);
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    // Values every EJS template can use without passing them in each res.render().
    Object.assign(app.locals, helpers, { CATEGORIES, ROLES, SERVICE_FEE_RATE });

    // ---------- 2. Body parsing & static files ----------
    app.use(express.urlencoded({ extended: true })); // HTML form submissions
    app.use(express.json());                          // JSON bodies sent to the REST API
    app.use(methodOverride("_method"));               // lets HTML forms send PUT/DELETE via ?_method=PUT
    app.use(express.static(path.join(__dirname, "public")));

    // ---------- 3. Sessions (stored in MongoDB so logins survive a restart) ----------
    if (isProduction && !process.env.SESSION_SECRET) {
        throw new Error("SESSION_SECRET must be set in production.");
    }
    const sessionSecret = process.env.SESSION_SECRET || "dev-only-secret-change-me";
    if (!process.env.SESSION_SECRET) console.warn("SESSION_SECRET is not set - using an insecure development secret.");

    app.use(
        session({
            store: MongoStore.create({
                client: mongoose.connection.getClient(),
                touchAfter: 24 * 3600, // only re-save an unchanged session once a day
            }),
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
                httpOnly: true,                   // JavaScript in the browser can't read the cookie
                sameSite: "lax",
                secure: isProduction,             // in production, only send the cookie over HTTPS
            },
        })
    );
    app.use(flash()); // one-time messages ("Listing created!") - needs sessions, so it comes after

    // ---------- 4. Authentication ----------
    app.use(passport.initialize());
    app.use(passport.session()); // reads the logged-in user from the session into req.user

    // Make the current user and flash messages available in every view.
    app.use((req, res, next) => {
        res.locals.currUser = req.user || null;
        res.locals.success = req.flash("success");
        res.locals.error = req.flash("error");
        res.locals.currentPath = req.path;
        next();
    });

    // ---------- 5. Routes ----------
    app.use("/api", require("./routes/api/index.js"));                // JSON REST API
    app.use("/", require("./routes/pages.js"));                       // home page
    app.use("/listings", require("./routes/listings.js"));
    app.use("/listings/:id/reviews", require("./routes/reviews.js"));
    app.use("/bookings", require("./routes/bookings.js"));
    app.use("/dashboard", require("./routes/dashboard.js"));
    app.use("/", require("./routes/users.js"));                       // signup, login, logout

    // ---------- 6. 404 - no route matched ----------
    app.all("*", (req, res, next) => {
        next(new ExpressError(404, "Page not found."));
    });

    // ---------- 7. Central error handler ----------
    app.use(errorHandler);

    return app;
}

/**
 * Every error in the app ends up here (thrown errors, next(err), rejected promises via wrapAsync).
 * Converts known error types to HTTP status codes, then responds:
 *   - API request          -> JSON  { error: "message" }
 *   - Web form (POST/PUT…) with a 4xx error -> flash the message and go back to the form
 *   - Web page otherwise   -> render the error page
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    let status = err.status || 500;
    let message = err.message || "Something went wrong.";

    if (err.name === "CastError") {
        status = 404; // e.g. /listings/not-a-real-id
        message = "Not found.";
    } else if (err.name === "ValidationError") {
        status = 400;
    } else if (err.name === "MulterError") {
        status = 400;
        message = `Upload error: ${err.message}`;
    }

    if (status >= 500) {
        console.error(err);
        message = "Something went wrong on our side. Please try again.";
    }

    if (helpers.isApiRequest(req)) {
        return res.status(status).json({ error: message });
    }
    if (status < 500 && req.method !== "GET") {
        req.flash("error", message);
        return res.redirect("back");
    }
    res.status(status).render("pages/error.ejs", { status, message });
}

module.exports = buildApp;
