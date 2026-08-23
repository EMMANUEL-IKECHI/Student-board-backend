const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Database connection

// --- A. READ ALL ACTIVE ANNOUNCEMENTS (For index.html and announcements.html) ---
router.get('/announcements', async (req, res) => {
    try {
        // Fetch only announcements marked as 'active', ordered by most recent first
        const queryText = `
            SELECT announcement_id, title, snippet, category, date_posted
            FROM Announcements
            WHERE status = 'active'
            ORDER BY date_posted DESC;
        `;
        
        const result = await db.query(queryText);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: "Server error while fetching announcements." });
    }
});

// --- B. READ SINGLE ANNOUNCEMENT DETAIL (For detail.html) ---
router.get('/announcements/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Fetch full content, checking for both active and archived
        const queryText = `
            SELECT announcement_id, title, content, category, date_posted, status
            FROM Announcements
            WHERE announcement_id = $1;
        `;
        
        const result = await db.query(queryText, [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Announcement not found." });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching announcement detail:', error);
        res.status(500).json({ message: "Server error while fetching detail." });
    }
});

// --- C. READ ARCHIVED ITEMS (For archive.html) ---
router.get('/archive', async (req, res) => {
    // Note: The Archive page needs a combined feed of Archived Announcements and Events
    try {
        const queryText = `
            SELECT announcement_id as ref_id, 'announcement' as type, title, date_posted as date, category
            FROM Announcements
            WHERE status = 'archived'
            UNION ALL
            SELECT event_id as ref_id, 'event' as type, title, event_date as date, location as category
            FROM Events
            WHERE status = 'archived'
            ORDER BY date DESC;
        `;
        
        const result = await db.query(queryText);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching archive:', error);
        res.status(500).json({ message: "Server error while fetching archive." });
    }
});

// --- D. READ ALL UPCOMING EVENTS (For events.html) ---
router.get('/events', async (req, res) => {
    try {
        // Fetch only events marked as 'upcoming', ordered by date
        const queryText = `
            SELECT event_id, title, snippet, event_date, event_time, location
            FROM Events
            WHERE status = 'upcoming'
            ORDER BY event_date ASC;
        `;
        
        const result = await db.query(queryText);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: "Server error while fetching events." });
    }
});

// --- E. READ SINGLE EVENT DETAIL (For detail.html) ---
router.get('/events/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Fetch full event details
        const queryText = `
            SELECT event_id, title, description, event_date, event_time, location, status
            FROM Events
            WHERE event_id = $1;
        `;
        
        const result = await db.query(queryText, [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Event not found." });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching event detail:', error);
        res.status(500).json({ message: "Server error while fetching event detail." });
    }
});

// --- F. READ TIMETABLES (For timetable.html) ---

// Get the current (active) timetable
router.get('/timetables/current', async (req, res) => {
    try {
        const queryText = `
            SELECT timetable_id, title, description, file_url, date_posted
            FROM Timetables
            WHERE status = 'current'
            ORDER BY date_posted DESC
            LIMIT 1;
        `;
        
        const result = await db.query(queryText);
        
        if (result.rowCount === 0) {
             // Return an empty array if no current timetable exists
            return res.status(200).json({}); 
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching current timetable:', error);
        res.status(500).json({ message: "Server error while fetching current timetable." });
    }
});

// Get the list of all archived timetables
router.get('/timetables/archive', async (req, res) => {
    try {
        const queryText = `
            SELECT timetable_id, title, description, date_posted
            FROM Timetables
            WHERE status = 'archived'
            ORDER BY date_posted DESC;
        `;
        
        const result = await db.query(queryText);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching archived timetables:', error);
        res.status(500).json({ message: "Server error while fetching archived timetables." });
    }
});

// ... (other public routes like /events)
module.exports = router;