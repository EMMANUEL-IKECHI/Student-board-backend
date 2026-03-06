# Student Board — Backend

The REST API backend powering the [Student Board](https://github.com/EMMANUEL-IKECHI/Student-board) web application. Handles authentication and serves departmental data to the frontend.

## Features

- User authentication (login/logout with protected routes)
- Serves student information and departmental announcements via API endpoints
- Structured for clean separation between frontend and backend concerns

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** JWT / session-based auth
- **Database:** (add yours here — e.g. MongoDB, MySQL, SQLite)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/EMMANUEL-IKECHI/Student-board-backend.git

# Navigate into the project
cd Student-board-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your DB connection string, JWT secret, etc.

# Start the server
node index.js
# or
npm start
```

## Environment Variables

Create a `.env` file in the root with the following:

```
PORT=5000
JWT_SECRET=your_jwt_secret
DB_URI=your_database_connection_string
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/logout` | Log out current user |
| GET | `/api/students` | Fetch student information |
| GET | `/api/announcements` | Fetch departmental announcements |

> Endpoints may require a valid auth token in the request header.

## Related Repository

Frontend: [Student-board](https://github.com/EMMANUEL-IKECHI/Student-board)

---

> Built by [Emmanuel Ikechi](https://github.com/EMMANUEL-IKECHI) — Computer Science undergraduate, FUTO.
