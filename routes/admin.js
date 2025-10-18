const express = require('express');
const router = express.Router();
const db = require('../db/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/auth'); // Import the JWT middleware

// Get the secret key from environment variables (from your .env file)
const JWT_SECRET = process.env.JWT_SECRET;

// --- A. PROTECTED CRUD MIDDLEWARE ---

// This route will run the middleware before execution.
router.get('/protected', authenticateToken, (req, res) => {
    // If the middleware passes, the token is valid, and the user data is in req.user
    res.json({ message: "Welcome to the protected admin area!", user: req.user });
});

// --- B. ADMIN LOGIN (Public Endpoint) ---

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    try {
        // 1. Fetch the user from the database
        const userQuery = await db.query('SELECT user_id, username, password, role FROM Users WHERE username = $1', [username]);

        const user = userQuery.rows[0];

        if (!user) {
            // User not found
            return res.status(401).json({ message: "Invalid username or password." });
        }

        // 2. Compare the submitted password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Password does not match
            return res.status(401).json({ message: "Invalid username or password." });
        }

        // 3. Password is correct. Create and sign a JSON Web Token (JWT)
        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // 4. Send the token back to the client
        res.status(200).json({
            message: "Login successful.",
            token: token,
            username: user.username
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Server error during login." });
    }
});


// ... (existing imports and /login route)

// --- A. ANNOUNCEMENT CRUD OPERATIONS (Protected) ---

// 1. POST: Create a new Announcement
router.post('/announcements', authenticateToken, async (req, res) => {
    // Requires: title, content, category
    const { title, content, category } = req.body;
    const snippet = content.substring(0, 150) + '...'; // Auto-generate snippet

    if (!title || !content || !category) {
        return res.status(400).json({ message: "Missing required fields: title, content, and category." });
    }

    try {
        const queryText = `
            INSERT INTO Announcements (title, snippet, content, category, status)
            VALUES ($1, $2, $3, $4, 'active') 
            RETURNING announcement_id, title, date_posted;
        `;
        const values = [title, snippet, content, category];
        
        const result = await db.query(queryText, values);

        res.status(201).json({ 
            message: "Announcement posted successfully.",
            announcement: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: "Server error while posting announcement." });
    }
});

// 2. PUT: Update an existing Announcement
router.put('/announcements/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, content, category, status } = req.body;
    
    // Check if at least one field is provided for update
    if (!title && !content && !category && !status) {
        return res.status(400).json({ message: "No fields provided for update." });
    }

    const snippet = content ? content.substring(0, 150) + '...' : null;
    
    // Build the query dynamically based on fields provided
    let setClauses = [];
    let values = [];
    let paramIndex = 1;

    if (title) { setClauses.push(`title = $${paramIndex++}`); values.push(title); }
    if (content) { setClauses.push(`content = $${paramIndex++}, snippet = $${paramIndex++}`); values.push(content, snippet); }
    if (category) { setClauses.push(`category = $${paramIndex++}`); values.push(category); }
    if (status) { setClauses.push(`status = $${paramIndex++}`); values.push(status); }

    values.push(id); // The last value is the announcement_id

    try {
        const queryText = `
            UPDATE Announcements 
            SET ${setClauses.join(', ')}
            WHERE announcement_id = $${paramIndex}
            RETURNING announcement_id;
        `;

        const result = await db.query(queryText, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Announcement not found." });
        }

        res.status(200).json({ message: "Announcement updated successfully." });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: "Server error while updating announcement." });
    }
});

// 3. DELETE: Delete/Archive an Announcement
// For safety, we will change its status to 'archived' instead of a hard delete.
router.delete('/announcements/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const queryText = `
            UPDATE Announcements
            SET status = 'archived'
            WHERE announcement_id = $1
            RETURNING title;
        `;
        
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Announcement not found." });
        }
        
        // Log the change to the Archive table (optional but good practice)
        await db.query(
            "INSERT INTO Archive (ref_id, type, title) VALUES ($1, 'announcement', $2)",
            [id, result.rows[0].title]
        );

        res.status(200).json({ 
            message: `Announcement "${result.rows[0].title}" moved to archive.`
        });

    } catch (error) {
        console.error('Error archiving announcement:', error);
        res.status(500).json({ message: "Server error while archiving announcement." });
    }
});

// --- B. EVENTS CRUD OPERATIONS (Protected) ---

// 1. POST: Create a new Event
router.post('/events', authenticateToken, async (req, res) => {
    // Requires: title, description, event_date, event_time, location
    const { title, description, event_date, event_time, location } = req.body;
    const snippet = description.substring(0, 150) + '...';

    if (!title || !description || !event_date || !location) {
        return res.status(400).json({ message: "Missing required fields: title, description, date, and location." });
    }

    try {
        const queryText = `
            INSERT INTO Events (title, snippet, description, event_date, event_time, location, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'upcoming') 
            RETURNING event_id, title, event_date;
        `;
        // Note: status is set to 'upcoming' by default
        const values = [title, snippet, description, event_date, event_time, location];
        
        const result = await db.query(queryText, values);

        res.status(201).json({ 
            message: "Event posted successfully.",
            event: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: "Server error while posting event." });
    }
});

// 2. PUT: Update an existing Event
router.put('/events/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, event_date, event_time, location, status } = req.body;
    
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "No fields provided for update." });
    }

    const snippet = description ? description.substring(0, 150) + '...' : null;
    
    let setClauses = [];
    let values = [];
    let paramIndex = 1;

    if (title) { setClauses.push(`title = $${paramIndex++}`); values.push(title); }
    if (description) { setClaases.push(`description = $${paramIndex++}, snippet = $${paramIndex++}`); values.push(description, snippet); }
    if (event_date) { setClauses.push(`event_date = $${paramIndex++}`); values.push(event_date); }
    if (event_time) { setClauses.push(`event_time = $${paramIndex++}`); values.push(event_time); }
    if (location) { setClauses.push(`location = $${paramIndex++}`); values.push(location); }
    if (status) { setClauses.push(`status = $${paramIndex++}`); values.push(status); }

    values.push(id); 

    try {
        const queryText = `
            UPDATE Events 
            SET ${setClauses.join(', ')}
            WHERE event_id = $${paramIndex}
            RETURNING event_id;
        `;

        const result = await db.query(queryText, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        res.status(200).json({ message: "Event updated successfully." });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: "Server error while updating event." });
    }
});

// 3. DELETE/Archive: Archive an Event
router.delete('/events/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Change status to 'archived' instead of hard delete
        const queryText = `
            UPDATE Events
            SET status = 'archived'
            WHERE event_id = $1
            RETURNING title;
        `;
        
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Event not found." });
        }
        
        // Log to the Archive table
        await db.query(
            "INSERT INTO Archive (ref_id, type, title) VALUES ($1, 'event', $2)",
            [id, result.rows[0].title]
        );

        res.status(200).json({ 
            message: `Event "${result.rows[0].title}" moved to archive.`
        });

    } catch (error) {
        console.error('Error archiving event:', error);
        res.status(500).json({ message: "Server error while archiving event." });
    }
});

// --- C. TIMETABLES CRUD OPERATIONS (Protected) ---

// 1. POST: Create a new Timetable entry (linking to a file)
router.post('/timetables', authenticateToken, async (req, res) => {
    // Requires: title, file_url
    const { title, description, file_url } = req.body;

    if (!title || !file_url) {
        return res.status(400).json({ message: "Missing required fields: title and file_url." });
    }

    try {
        // Automatically set the new timetable as 'current' and archive all previous ones
        await db.query(`UPDATE Timetables SET status = 'archived' WHERE status = 'current'`);

        const queryText = `
            INSERT INTO Timetables (title, description, file_url, status)
            VALUES ($1, $2, $3, 'current') 
            RETURNING timetable_id, title, date_posted;
        `;
        const values = [title, description, file_url];
        
        const result = await db.query(queryText, values);

        res.status(201).json({ 
            message: "New Timetable posted successfully. Previous versions archived.",
            timetable: result.rows[0]
        });
    } catch (error) {
        console.error('Error posting timetable:', error);
        res.status(500).json({ message: "Server error while posting timetable." });
    }
});

// 2. PUT: Update an existing Timetable entry (e.g., updating the description)
router.put('/timetables/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, file_url, status } = req.body;
    
    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "No fields provided for update." });
    }

    let setClauses = [];
    let values = [];
    let paramIndex = 1;

    if (title) { setClauses.push(`title = $${paramIndex++}`); values.push(title); }
    if (description) { setClauses.push(`description = $${paramIndex++}`); values.push(description); }
    if (file_url) { setClauses.push(`file_url = $${paramIndex++}`); values.push(file_url); }
    if (status) { setClauses.push(`status = $${paramIndex++}`); values.push(status); }

    values.push(id); 

    try {
        const queryText = `
            UPDATE Timetables 
            SET ${setClauses.join(', ')}
            WHERE timetable_id = $${paramIndex}
            RETURNING timetable_id;
        `;

        const result = await db.query(queryText, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Timetable entry not found." });
        }

        res.status(200).json({ message: "Timetable entry updated successfully." });
    } catch (error) {
        console.error('Error updating timetable:', error);
        res.status(500).json({ message: "Server error while updating timetable." });
    }
});

// 3. DELETE/Archive: Archive a Timetable (Sets status to 'archived')
router.delete('/timetables/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const queryText = `
            UPDATE Timetables
            SET status = 'archived'
            WHERE timetable_id = $1
            RETURNING title;
        `;
        
        const result = await db.query(queryText, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Timetable entry not found." });
        }
        
        res.status(200).json({ 
            message: `Timetable "${result.rows[0].title}" archived.`
        });

    } catch (error) {
        console.error('Error archiving timetable:', error);
        res.status(500).json({ message: "Server error while archiving timetable." });
    }
});

// ... (other admin routes like /events CRUD)
module.exports = router;