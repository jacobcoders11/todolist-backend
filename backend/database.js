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

        console.log('✅ Connected to MySQL database');

        // Create the todos table if it doesn't exist yet
        await connection.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Todos table is ready');

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