const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true } // adds createdAt / updatedAt automatically
);

module.exports = mongoose.model("Review", reviewSchema);
