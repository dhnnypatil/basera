const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const validate = require("../middleware/validate.js");
const { signupSchema } = require("../validators/schemas.js");
const userController = require("../controllers/users.js");

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(validate(signupSchema), wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(userController.login);

// POST (not GET) so a link or image on another site can't log you out.
router.post("/logout", userController.logout);

module.exports = router;
