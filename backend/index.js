// Load environment variables
require('dotenv').config();

// Import libraries
const express = require('express');
const { connectToMySQL } = require('./database');

// Create the app
const app = express();
const port = process.env.PORT || 5000;

// Middleware to read JSON from requests
app.use(express.json());

// Import routes
const router = require('./routes');
app.use("/api", router);

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



