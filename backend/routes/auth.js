const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../database');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@email.com
 *               phone_number:
 *                 type: string
 *                 example: 1234567890
 *               password:
 *                 type: string
 *                 example: mypassword123
 *               role:
 *                 type: integer
 *                 example: 2
 *                 description: 1=admin, 2=user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already exists or validation error
 *       500:
 *         description: Server error
 */

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        // Get data from request body
        const { name, email, phone_number, password, role } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Get database connection
        const connection = getConnection();

        // Check if email already exists
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash the password (10 = salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into database
        const [result] = await connection.query(
            'INSERT INTO users (name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone_number || null, hashedPassword, role]
        );

        // Send success response
        res.status(201).json({
            message: 'User registered successfully!',
            userId: result.insertId
        });

    } catch (error) {
        console.error('❌ Error registering user:', error.message);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@email.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        // Get email and password from request
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get database connection
        const connection = getConnection();

        // Find user by email
        const [users] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        // Check if user exists
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Compare password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        // Send success response (don't send password!)
        res.json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Error logging in:', error.message);
        res.status(500).json({ error: 'Failed to login' });
    }
});

module.exports = router;