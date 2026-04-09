const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDb() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    console.log('🚀 Connecting to MySQL at ' + config.host + '...');
    
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL server!');

        const schemaPath = path.join(__dirname, '../../setup/schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at: ${schemaPath}`);
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('📜 Executing database schema...');
        await connection.query(schema);
        console.log('✨ Database and tables created successfully!');

    } catch (err) {
        console.error('\n❌ DATABASE INITIALIZATION FAILED');
        if (err.code === 'ECONNREFUSED') {
            console.error('Connection refused. Is your MySQL server running?');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied. Check your DB_USER and DB_PASSWORD in .env');
        } else {
            console.error('Error Details:', err.message);
        }
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
    
    process.exit(0);
}

initDb();
