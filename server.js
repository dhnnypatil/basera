/**
 * Entry point:  npm start  (or  npm run dev  to auto-restart on file changes)
 *
 * 1. Load environment variables from .env (in development)
 * 2. Connect to MongoDB
 * 3. Build the Express app and start listening
 */
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const { connectDB } = require("./config/db.js");
const buildApp = require("./app.js");

const PORT = process.env.PORT || 8080;

async function start() {
    await connectDB();
    const app = buildApp();
    app.listen(PORT, () => {
        console.log(`Basera is running at http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error("Failed to start the server:", err);
    process.exit(1);
});
