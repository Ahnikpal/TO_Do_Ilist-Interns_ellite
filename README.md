# TaskMaster - Full Stack Todo Application

A modern, secure, and responsive Full Stack Todo Application built with Node.js, Express, MySQL, and Vanilla JavaScript.

## Features

- **User Authentication**: Secure registration and login using JWT and bcrypt password hashing.
- **Task Management**: Create, update, delete, and mark tasks as completed.
- **Search & Sort**: Filter tasks by title and sort them by creation date.
- **Protected Routes**: Only logged-in users can manage their own tasks.
- **Premium UI**: Clean, light-mode interface with a soft shadow layout, designed to be fully responsive.
- **Error Handling**: Comprehensive error messages and loading indicators.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Security**: JWT (JSON Web Tokens), Bcrypt.js

## Prerequisites

- [Node.js](https://nodejs.org/) installed.
- [MySQL](https://www.mysql.com/) server running.

## Setup Instructions

### 1. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench, phpMyAdmin, or terminal).
2. Run the SQL script found in `setup/schema.sql` to create the database and tables.
   ```sql
   -- Alternatively, run manually:
   CREATE DATABASE todo_db;
   USE todo_db;
   -- Then copy-paste the CREATE TABLE queries from setup/schema.sql
   ```

### 2. Backend Configuration
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory based on `.env.example`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=todo_db
   JWT_SECRET=your_super_secret_key
   ```

### 3. Running the Application
1. **Start Backend**:
   ```bash
   cd backend
   npm start
   # or for development:
   node server.js
   ```
2. **Open the Application**:
   Navigate to [http://localhost:5000/](http://localhost:5000/) in your web browser. The Node.js server serves the frontend statically, so no additional live servers are needed!

## API Endpoints

### Auth
- `POST /api/auth/register`: Create a new user.
- `POST /api/auth/login`: Authenticate user and receive JWT.

### Tasks (Requires Authorization header)
- `GET /api/tasks`: Fetch all tasks for the user (supports `?search=` and `?sort=`).
- `POST /api/tasks`: Create a new task.
- `PUT /api/tasks/:id`: Update task title or status.
- `DELETE /api/tasks/:id`: Delete a task.

## License
MIT
