const express = require("express");
const router = express.Router();
const wrapAsync = require("../../utils/wrapAsync.js");
const validate = require("../../middleware/validate.js");
const { isLoggedIn } = require("../../middleware/auth.js");
const { signupSchema } = require("../../validators/schemas.js");
const authApi = require("../../controllers/api/auth.js");

router.post("/signup", validate(signupSchema), wrapAsync(authApi.signup));
router.post("/login", authApi.login);
router.post("/logout", isLoggedIn, authApi.logout);
router.get("/me", isLoggedIn, authApi.me);

module.exports = router;
