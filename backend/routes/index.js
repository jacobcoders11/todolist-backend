const express = require('express');
const router = express.Router();
const { getConnection } = require('../database');

// GET /api/todos - Get all todos
router.get('/todos', async (req, res) => {
    try {
        // Get database connection
        const connection = getConnection();
        
        // Get all todos from database, newest first
        const [todos] = await connection.query('SELECT * FROM todos ORDER BY created_at DESC');
        
        // Send todos as response
        res.json({ todos });
        
    } catch (error) {
        console.error('Error getting todos:', error.message);
        res.status(500).json({ error: 'Failed to get todos' });
    }
});

// POST /api/todos - Create a new todo
router.post('/todos', async (req, res) => {
    try {
        // Get the todo data from request
        const { todo } = req.body;

        // Check if title exists
        if (!todo || !todo.title) {
            return res.status(400).json({ error: 'Todo title is required' });
        }

        // Get database connection
        const connection = getConnection();
        
        // Insert new todo into database
        const [result] = await connection.query(
            'INSERT INTO todos (title, completed) VALUES (?, ?)',
            [todo.title, todo.completed || false]
        );

        // Send success response
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

// DELETE /api/todos/:id - Delete a todo
router.delete('/todos/:id', async (req, res) => {
    try {
        // Get the id from URL
        const { id } = req.params;

        // Get database connection
        const connection = getConnection();
        
        // Delete todo from database
        const [result] = await connection.query('DELETE FROM todos WHERE id = ?', [id]);

        // Check if todo was found and deleted
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // Send success response
        res.json({ message: 'Todo deleted!' });
        
    } catch (error) {
        console.error('Error deleting todo:', error.message);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// PUT /api/todos/:id - Update a todo (mark as complete/incomplete or edit title)
router.put('/todos/:id', async (req, res) => {
    try {
        // Get the id from URL and data from body
        const { id } = req.params;
        const { completed, title } = req.body;

        // Get database connection
        const connection = getConnection();
        
        // Build update query based on what's being updated
        let query, params;
        
        if (title !== undefined && completed !== undefined) {
            // Update both title and completed
            query = 'UPDATE todos SET title = ?, completed = ? WHERE id = ?';
            params = [title, completed, id];
        } else if (title !== undefined) {
            // Update only title
            query = 'UPDATE todos SET title = ? WHERE id = ?';
            params = [title, id];
        } else if (completed !== undefined) {
            // Update only completed status
            query = 'UPDATE todos SET completed = ? WHERE id = ?';
            params = [completed, id];
        } else {
            return res.status(400).json({ error: 'No update data provided' });
        }
        
        // Update todo in database
        const [result] = await connection.query(query, params);

        // Check if todo was found and updated
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // Send success response
        res.json({ message: 'Todo updated!' });
        
    } catch (error) {
        console.error('Error updating todo:', error.message);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

module.exports = router;