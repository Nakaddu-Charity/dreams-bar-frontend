// api/rooms.js - Vercel Serverless Function for Rooms API

const { Pool } = require('pg'); // Import Pool from pg

// Initialize PostgreSQL Pool using DATABASE_URL from Vercel Environment Variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necessary for connecting to Supabase from Vercel
    }
});

// This is the main function that Vercel will execute for /api/rooms requests
module.exports = async (req, res) => {
    // Set CORS headers for all responses from this function
    res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        switch (req.method) {
            case 'GET':
                const getResult = await pool.query('SELECT * FROM rooms ORDER BY id ASC');
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                const { room_number, type, price_per_night, status } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO rooms (room_number, type, price_per_night, status) VALUES ($1, $2, $3, $4) RETURNING *',
                    [room_number, type, price_per_night, status]
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                const { id: putId } = req.query; // ID comes from query params in serverless
                const { room_number: putRoomNumber, type: putType, price_per_night: putPricePerNight, status: putStatus } = req.body;
                const putResult = await pool.query(
                    'UPDATE rooms SET room_number = $1, type = $2, price_per_night = $3, status = $4 WHERE id = $5 RETURNING *',
                    [putRoomNumber, putType, putPricePerNight, putStatus, putId]
                );
                if (putResult.rows.length > 0) {
                    res.status(200).json(putResult.rows[0]);
                } else {
                    res.status(404).json({ message: 'Room not found' });
                }
                break;

            case 'DELETE':
                const { id: deleteId } = req.query; // ID comes from query params in serverless
                const deleteResult = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    res.status(204).end(); // No Content
                } else {
                    res.status(404).json({ message: 'Room not found' });
                }
                break;

            default:
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Error in rooms API:', err);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};
