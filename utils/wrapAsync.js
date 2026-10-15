/**
 * Express 4 doesn't catch errors thrown inside async functions.
 * Wrapping a handler with wrapAsync forwards any rejected promise to next(err),
 * so it reaches our central error handler instead of crashing the server.
 */
module.exports = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
