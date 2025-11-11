// Load environment variables from .env file
require('dotenv').config();

// Import MySQL library
const mysql = require('mysql2/promise');

// Variable to store database connection
let connection;

// Function to connect to MySQL database
async function connectToMySQL() {
    try {
        // Create connection using info from .env file
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,        // localhost
            user: process.env.DB_USER,        // root
            password: process.env.DB_PASSWORD, // your password
            database: process.env.DB_NAME     // todosdb
        });

        console.log('Connected to MySQL database');

    } catch (error) {
        console.error('Database connection error:', error.message);
        throw error;
    }
}

// Function to get the database connection
function getConnection() {
    return connection;
}

// Export functions so other files can use them
module.exports = {
    connectToMySQL,
    getConnection
};