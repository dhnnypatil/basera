/**
 * Database connection.
 *
 * - If MONGO_URL is set in .env, we connect to that database (local MongoDB or Atlas).
 * - If it is NOT set, we start a throw-away in-memory MongoDB and fill it with demo
 *   data, so the project runs with zero setup. Data resets every time the server restarts.
 */
const mongoose = require("mongoose");

let memoryServer = null;

async function connectDB() {
    let mongoUrl = process.env.MONGO_URL;
    const usingMemoryDb = !mongoUrl;

    if (usingMemoryDb && process.env.NODE_ENV === "production") {
        throw new Error("MONGO_URL must be set in production (the in-memory database is for local development only).");
    }

    if (usingMemoryDb) {
        // Required lazily so production installs don't need this dev-only package.
        const { MongoMemoryServer } = require("mongodb-memory-server");
        memoryServer = await MongoMemoryServer.create();
        mongoUrl = memoryServer.getUri("basera");
        console.log("No MONGO_URL found - using a temporary in-memory database.");
    }

    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    if (usingMemoryDb) {
        const { seedDatabase } = require("../seeds/seed.js");
        await seedDatabase();
    }
}

async function disconnectDB() {
    await mongoose.disconnect();
    if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
