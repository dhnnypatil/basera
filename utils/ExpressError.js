/**
 * An Error that also carries an HTTP status code.
 * Throw it anywhere (controller, service, middleware) and the error handler in app.js
 * turns it into a proper response - an error page for the website, JSON for the API.
 *
 *   throw new ExpressError(404, "Listing not found");
 */
class ExpressError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = ExpressError;
