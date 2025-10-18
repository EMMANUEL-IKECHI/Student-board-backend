require('dotenv').config(); // Loads environment variables
const express = require('express');
const cors = require('cors');
const app = express();

// Database initialization
require('./db/database');

// Middleware
app.use(cors()); // Enables cross-origin requests
app.use(express.json()); // Parses JSON bodies

// Route Handlers
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

// Mount Routes
app.use('/api', publicRoutes); // e.g., /api/announcements
app.use('/api/admin', adminRoutes); // e.g., /api/admin/login

// Health Check
app.get('/', (req, res) => {
    res.send('FUTO CIT API is running! Check /api for endpoints.');
});

// Server Listening
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});