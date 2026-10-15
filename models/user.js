const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const { ROLES } = require("../utils/constants.js");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.CUSTOMER,
            required: true,
        },
    },
    { timestamps: true }
);

// Adds `username`, a hashed + salted password, and helpers like User.register() and User.authenticate()
userSchema.plugin(passportLocalMongoose);

userSchema.methods.isHost = function () {
    return this.role === ROLES.HOST;
};

userSchema.methods.isCustomer = function () {
    return this.role === ROLES.CUSTOMER;
};

/** The safe, public version of a user - never send password hashes/salts in an API response. */
userSchema.methods.toPublicJSON = function () {
    return { _id: this._id, username: this.username, email: this.email, role: this.role };
};

module.exports = mongoose.model("User", userSchema);
