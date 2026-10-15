/**
 * Seeds a real MongoDB database:   npm run seed
 * (Not needed in in-memory mode - that seeds itself on every start.)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { seedDatabase } = require("./seed.js");

async function main() {
    if (!process.env.MONGO_URL) {
        console.log("MONGO_URL is not set in .env - nothing to seed (in-memory mode seeds itself automatically).");
        return;
    }
    await mongoose.connect(process.env.MONGO_URL);
    await seedDatabase();
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
