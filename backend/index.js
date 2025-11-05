// Load environment variables
require('dotenv').config();

// Import libraries
const express = require('express');
const { connectToMySQL } = require('./database');
const setupSwagger = require('./swagger');  // ← ADD THIS

// Create the app
const app = express();
const port = process.env.PORT || 5000;

// Middleware to read JSON from requests
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);  // ← ADD THIS

// Import routes
const todoRoutes = require('./routes');  // ← RENAME for clarity
const authRoutes = require('./routes/auth');  // ← ADD THIS
const userRoutes = require('./routes/users');  // ← ADD THIS

// Use routes
app.use("/api", todoRoutes);  // ← Todo routes at /api/todos
app.use("/api/auth", authRoutes);  // ← ADD THIS - Auth routes at /api/auth
app.use("/api/users", userRoutes);  // ← ADD THIS - User routes at /api/users

// Start the server
async function startServer() {
    // Connect to database first
    await connectToMySQL();

    // Then start listening for requests
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();