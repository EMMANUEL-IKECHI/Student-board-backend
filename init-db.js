require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERROR: DATABASE_URL is missing in .env');
    process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

const schema = `
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS Announcements (
    announcement_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    snippet TEXT,
    content TEXT NOT NULL,
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    snippet TEXT,
    description TEXT,
    event_date DATE NOT NULL,
    event_time VARCHAR(50),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS Timetables (
    timetable_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'current',
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Archive (
    archive_id SERIAL PRIMARY KEY,
    ref_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDB() {
    try {
        console.log('Creating tables...');
        await pool.query(schema);
        console.log('Tables created successfully.');

        const userCheck = await pool.query("SELECT * FROM Users WHERE username = 'admin'");
        if (userCheck.rows.length === 0) {
            console.log('Admin user not found. Creating default admin user...');
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query("INSERT INTO Users (username, password, role) VALUES ($1, $2, 'admin')", ['admin', hash]);
            console.log('Default admin created. Username: admin, Password: admin123');
        } else {
            console.log('Admin user already exists.');
        }

        console.log('Database initialization complete!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        pool.end();
    }
}

initDB();
