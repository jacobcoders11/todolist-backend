const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getConnection } = require('../database');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     role:
 *                       type: string
 *                     created_at:
 *                       type: string
 *       401:
 *         description: Unauthorized - No token provided
 *       404:
 *         description: User not found
 */
// GET /api/users/me - Get current user's profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const connection = getConnection();
        
        // Get user ID from the JWT token (set by authenticateToken middleware)
        const userId = req.user.userId;
        
        // Fetch user from database (exclude password)
        const [users] = await connection.query(
            'SELECT id, name, email, phone_number, role, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user: users[0] });
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: newemail@example.com
 *               phone_number:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: No update data provided or email already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// PUT /api/users/me - Update current user's profile
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const connection = getConnection();
        const userId = req.user.userId;
        const { name, email, phone_number } = req.body;
        
        // Check if at least one field is provided
        if (!name && !email && !phone_number) {
            return res.status(400).json({ error: 'No update data provided' });
        }
        
        // If email is being updated, check if it already exists for another user
        if (email) {
            const [existingUsers] = await connection.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            
            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }
        
        // Build dynamic query based on what fields are provided
        let query = 'UPDATE users SET ';
        const params = [];
        const updates = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        
        if (phone_number !== undefined) {
            updates.push('phone_number = ?');
            params.push(phone_number);
        }
        
        query += updates.join(', ') + ' WHERE id = ?';
        params.push(userId);
        
        const [result] = await connection.query(query, params);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @swagger
 * /api/users/me/change-password:
 *   post:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: ""
 *               newPassword:
 *                 type: string
 *                 example: "" 
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing required fields or invalid current password
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// POST /api/users/me/change-password - Change user's password
router.post('/me/change-password', authenticateToken, async (req, res) => {
    try {
        const connection = getConnection();
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        
        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Both currentPassword and newPassword are required' 
            });
        }
        
        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters long' 
            });
        }
        
        // Get user's current hashed password from database
        const [users] = await connection.query(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password in database
        await connection.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, userId]
        );
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error.message);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

module.exports = router;