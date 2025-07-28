// api/categories.js - Vercel Serverless Function for Categories API (ES Module)

import { Pool } from 'pg';

// Initialize PostgreSQL Pool globally to be reused across warm invocations
// Configure max connections, idle timeout, connection timeout, and allowExitOnIdle for serverless environment
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessary for connecting to Supabase from Vercel
    },
    max: 2, // Keep a small number of max connections per function instance
    idleTimeoutMillis: 5000, // Close idle connections after 5 seconds
    connectionTimeoutMillis: 10000, // Give 10 seconds to establish a connection
    allowExitOnIdle: true // Crucial for serverless: allow process to exit if no clients are active
});

// This is the main function that Vercel will execute for /api/categories requests
export default async (req, res) => {
    // Set CORS headers for all responses from this function
    res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS'); // Categories only needs GET
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        switch (req.method) {
            case 'GET':
                const getResult = await pool.query('SELECT * FROM categories ORDER BY id ASC');
                res.status(200).json(getResult.rows);
                break;

            default:
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Error in categories API:', err);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};
