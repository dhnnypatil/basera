/**
 * Small helper functions shared across the app.
 * The format* helpers are also exposed to every EJS view through app.locals (see app.js).
 */

/** Is this request for the JSON API (as opposed to a web page)? */
function isApiRequest(req) {
    return req.originalUrl.startsWith("/api");
}

/** Today's date as "YYYY-MM-DD" in the server's local timezone (used for <input type="date" min>). */
function todayISO() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now - offsetMs).toISOString().slice(0, 10);
}

/** Date -> "YYYY-MM-DD" (used to pre-fill date inputs). */
function toDateInputValue(date) {
    return date ? new Date(date).toISOString().slice(0, 10) : "";
}

/** 2500 -> "₹2,500" */
function formatPrice(amount) {
    return "₹" + Math.round(amount).toLocaleString("en-IN");
}

/** Date -> "16 Oct 2026" */
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC", // bookings are stored as midnight UTC dates
    });
}

module.exports = { isApiRequest, todayISO, toDateInputValue, formatPrice, formatDate };
