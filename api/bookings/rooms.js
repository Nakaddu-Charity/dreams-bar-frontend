// api/bookings/rooms.js - Vercel Serverless Function for Bookings API (ES Module)

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

// This is the main function that Vercel will execute for /api/bookings/rooms requests
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
                const { search, status } = req.query; // Extract search and status from query parameters
                let query = `
                    SELECT
                        b.id,
                        b.room_id,
                        b.client_id,
                        b.check_in_date,
                        b.check_out_date,
                        b.total_price,
                        b.status,
                        r.room_number,
                        r.type AS room_type,
                        c.name AS client_name
                    FROM
                        bookings b
                    JOIN
                        rooms r ON b.room_id = r.id
                    JOIN
                        clients c ON b.client_id = c.id
                `;
                const queryParams = [];
                const conditions = [];
                let paramIndex = 1;

                if (search) {
                    // Search by room_number OR client_name (case-insensitive)
                    conditions.push(`(r.room_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`);
                    queryParams.push(`%${search}%`);
                    paramIndex++; // Increment for the next parameter if there is one
                }
                if (status) {
                    conditions.push(`b.status = $${paramIndex++}`);
                    queryParams.push(status);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }

                query += ' ORDER BY b.id ASC'; // Always order by ID

                const getResult = await pool.query(query, queryParams);
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                const { room_id, client_id, check_in_date, check_out_date, total_price, status: postStatus } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO bookings (room_id, client_id, check_in_date, check_out_date, total_price, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                    [room_id, client_id, check_in_date, check_out_date, total_price, postStatus]
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                const { id: putId } = req.query;
                const { room_id: putRoomId, client_id: putClientId, check_in_date: putCheckInDate, check_out_date: putCheckOutDate, total_price: putTotalPrice, status: putStatus } = req.body;
                const putResult = await pool.query(
                    'UPDATE bookings SET room_id = $1, client_id = $2, check_in_date = $3, check_out_date = $4, total_price = $5, status = $6 WHERE id = $7 RETURNING *',
                    [putRoomId, putClientId, putCheckInDate, putCheckOutDate, putTotalPrice, putStatus, putId]
                );
                if (putResult.rows.length > 0) {
                    res.status(200).json(putResult.rows[0]);
                } else {
                    res.status(404).json({ message: 'Booking not found' });
                }
                break;

            case 'DELETE':
                const { id: deleteId } = req.query;
                const deleteResult = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    res.status(204).end();
                } else {
                    res.status(404).json({ message: 'Booking not found' });
                }
                break;

            default:
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Error in bookings API:', err);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};
