// api/rooms.js - Vercel Serverless Function for Rooms API (ES Module)

import { Pool } from 'pg';

// Initialize PostgreSQL Pool globally to be reused across warm invocations
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true
});

// This is the main function that Vercel will execute for /api/rooms requests
export default async (req, res) => {
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
                const { search, status } = req.query;
                let query = 'SELECT * FROM rooms';
                const queryParams = [];
                const conditions = [];
                let paramIndex = 1;

                if (search) {
                    conditions.push(`room_number ILIKE $${paramIndex++}`);
                    queryParams.push(`%${search}%`);
                }
                if (status) {
                    conditions.push(`status = $${paramIndex++}`);
                    queryParams.push(status);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }

                query += ' ORDER BY id ASC';

                const getResult = await pool.query(query, queryParams);
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                // Backend RBAC Check for POST (Create Room) - Only Admin
                const postRole = req.body.role; // Assuming role is sent in body for now
                if (postRole !== 'admin') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators can add rooms.' });
                }

                const { room_number, type, price_per_night, status: postStatus } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO rooms (room_number, type, price_per_night, status) VALUES ($1, $2, $3, $4) RETURNING *',
                    [room_number, type, price_per_night, postStatus]
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                // Backend RBAC Check for PUT (Update Room) - Only Admin
                const putRole = req.body.role; // Assuming role is sent in body for now
                if (putRole !== 'admin') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators can update rooms.' });
                }

                const { id: putId } = req.query;
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
                // Backend RBAC Check for DELETE (Delete Room) - Only Admin
                const deleteRole = req.query.role; // Assuming role is sent in query for DELETE (simpler for DELETE method)
                if (deleteRole !== 'admin') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators can delete rooms.' });
                }

                const { id: deleteId } = req.query;
                const deleteResult = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    // FIX: Send a JSON response instead of 204 No Content
                    res.status(200).json({ message: 'Room deleted successfully.' });
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
