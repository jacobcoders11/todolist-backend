const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Todo List Backend is running!' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
