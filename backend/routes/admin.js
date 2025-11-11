const express = require('express');
const router = express.Router();
const { getConnection } = require('../database');
const { authenticateToken } = require('../middleware/auth'); // Use existing auth

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
    if (req.user.role !== 1) {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

/**
 * @swagger
 * /api/admin/todos:
 *   get:
 *     summary: Get all todos from all users (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all todos
 *       403:
 *         description: Access denied - Admin only
 */
// GET /api/admin/todos - Get all todos from all users
router.get('/todos', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const connection = getConnection();
        
        // Get all todos with user information
        const [todos] = await connection.query(`
            SELECT todos.*, users.name as user_name, users.email as user_email 
            FROM todos 
            LEFT JOIN users ON todos.user_id = users.id 
            ORDER BY todos.created_at DESC
        `);
        
        res.json({ todos });
    } catch (error) {
        console.error('Error getting all todos:', error.message);
        res.status(500).json({ error: 'Failed to get todos' });
    }
});

/**
 * @swagger
 * /api/admin/todos/{id}:
 *   delete:
 *     summary: Delete any todo (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Todo not found
 */
// DELETE /api/admin/todos/:id - Delete any todo
router.delete('/todos/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();

        const [result] = await connection.query('DELETE FROM todos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error('Error deleting todo:', error.message);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all user accounts (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Access denied - Admin only
 */
// GET /api/admin/users - Get all users
router.get('/users', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const connection = getConnection();
        
        // Get all users (exclude passwords)
        const [users] = await connection.query(
            'SELECT id, name, email, phone_number, role, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        
        res.json({ users });
    } catch (error) {
        console.error('Error getting users:', error.message);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete any user account (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete yourself
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: User not found
 */
// DELETE /api/admin/users/:id - Delete any user
router.delete('/users/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const connection = getConnection();

        // Prevent admin from deleting themselves
        if (parseInt(id) === adminId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics (Admin Only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       403:
 *         description: Access denied - Admin only
 */
// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const connection = getConnection();
        
        // Get total users count
        const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
        
        // Get total todos count
        const [todoCount] = await connection.query('SELECT COUNT(*) as count FROM todos');
        
        // Get completed todos count
        const [completedCount] = await connection.query('SELECT COUNT(*) as count FROM todos WHERE completed = 1');
        
        // Get pending todos count
        const [pendingCount] = await connection.query('SELECT COUNT(*) as count FROM todos WHERE completed = 0');
        
        res.json({
            stats: {
                totalUsers: userCount[0].count,
                totalTodos: todoCount[0].count,
                completedTodos: completedCount[0].count,
                pendingTodos: pendingCount[0].count
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error.message);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

module.exports = router;