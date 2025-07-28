// api/clients.js - Vercel Serverless Function for Clients API

const { Pool } = require('pg'); // Import Pool from pg

// Initialize PostgreSQL Pool using DATABASE_URL from Vercel Environment Variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessary for connecting to Supabase from Vercel
    }
});

// This is the main function that Vercel will execute for /api/clients requests
module.exports = async (req, res) => {
    // Set CORS headers for all responses from this function
    res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS'); // Clients only needs GET
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        switch (req.method) {
            case 'GET':
                const getResult = await pool.query('SELECT * FROM clients ORDER BY id ASC');
                res.status(200).json(getResult.rows);
                break;

            default:
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Error in clients API:', err);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};
