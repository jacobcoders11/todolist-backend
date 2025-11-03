const express = require('express');
const router = express.Router();

// Basic test route
router.get('/test', (req, res) => {
    res.status(200).json({ 
        message: 'API routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Todo routes placeholder
router.get('/todos', (req, res) => {
    res.status(200).json({ 
        message: 'Todos endpoint - coming soon!',
        todos: []
    });
});

router.post('/todos', (req, res) => {
    res.status(200).json({ 
        message: 'Create todo endpoint - coming soon!'
    });
});

module.exports = router;