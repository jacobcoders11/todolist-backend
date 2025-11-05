const express = require('express');
const router = express.Router();
const { getConnection } = require('../database');
const { authenticateToken } = require('../middleware/auth'); // ← Import middleware

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Get all todos (Protected)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all todos
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Invalid token
 *       500:
 *         description: Server error
 */
// GET /api/todos - PROTECTED (need authentication)
router.get('/todos', authenticateToken, async (req, res) => { // ← Add authenticateToken here
    try {
        const connection = getConnection();
        
        // Optional: You can filter todos by logged-in user
        // console.log('User ID:', req.user.userId);
        
        const [todos] = await connection.query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json({ todos });
    } catch (error) {
        console.error('Error getting todos:', error.message);
        res.status(500).json({ error: 'Failed to get todos' });
    }
});

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Create a new todo (Protected)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - todo
 *             properties:
 *               todo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Buy groceries
 *                   completed:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       201:
 *         description: Todo created successfully
 *       401:
 *         description: Unauthorized - No token
 *       403:
 *         description: Forbidden - Invalid token
 */
// POST /api/todos - PROTECTED (need authentication)
router.post('/todos', authenticateToken, async (req, res) => { // ← Add authenticateToken
    try {
        const { todo } = req.body;

        if (!todo || !todo.title) {
            return res.status(400).json({ error: 'Todo title is required' });
        }

        const connection = getConnection();
        
        const [result] = await connection.query(
            'INSERT INTO todos (title, completed) VALUES (?, ?)',
            [todo.title, todo.completed || false]
        );

        res.status(201).json({
            message: 'Todo created!',
            todo: {
                id: result.insertId,
                title: todo.title,
                completed: todo.completed || false
            }
        });
    } catch (error) {
        console.error('Error creating todo:', error.message);
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Update a todo (Protected)
 *     tags: [Todos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Todo ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Todo updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Todo not found
 */
// PUT /api/todos/:id - PROTECTED (need authentication)
router.put('/todos/:id', authenticateToken, async (req, res) => { // ← Add authenticateToken
    try {
        const { id } = req.params;
        const { completed, title } = req.body;
        const connection = getConnection();

        let query, params;

        if (title !== undefined && completed !== undefined) {
            query = 'UPDATE todos SET title = ?, completed = ? WHERE id = ?';
            params = [title, completed, id];
        } else if (title !== undefined) {
            query = 'UPDATE todos SET title = ? WHERE id = ?';
            params = [title, id];
        } else if (completed !== undefined) {
            query = 'UPDATE todos SET completed = ? WHERE id = ?';
            params = [completed, id];
        } else {
            return res.status(400).json({ error: 'No update data provided' });
        }

        const [result] = await connection.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json({ message: 'Todo updated!' });
    } catch (error) {
        console.error('Error updating todo:', error.message);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Delete a todo (Protected)
 *     tags: [Todos]
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
 *         description: Todo deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Todo not found
 */
// DELETE /api/todos/:id - PROTECTED (need authentication)
router.delete('/todos/:id', authenticateToken, async (req, res) => { // ← Add authenticateToken
    try {
        const { id } = req.params;
        const connection = getConnection();

        const [result] = await connection.query('DELETE FROM todos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json({ message: 'Todo deleted!' });
    } catch (error) {
        console.error('Error deleting todo:', error.message);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

module.exports = router;