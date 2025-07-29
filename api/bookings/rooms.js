// api/bookings/rooms.js - Vercel Serverless Function for Bookings API (ES Module)

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
                const { search, status } = req.query;
                let query = `
                    SELECT
                        b.id,
                        b.room_id,
                        b.check_in_date,
                        b.check_out_date,
                        b.total_price,
                        b.status,
                        b.client_name,      -- NEW: Select client_name directly
                        b.client_contact,   -- NEW: Select client_contact directly
                        r.room_number,
                        r.type AS room_type
                    FROM
                        bookings b
                    JOIN
                        rooms r ON b.room_id = r.id
                `;
                const queryParams = [];
                const conditions = [];
                let paramIndex = 1;

                if (search) {
                    // NEW: Search by client_name or room_number
                    conditions.push(`(b.client_name ILIKE $${paramIndex} OR r.room_number ILIKE $${paramIndex})`);
                    queryParams.push(`%${search}%`);
                    paramIndex++;
                }
                if (status) {
                    conditions.push(`b.status = $${paramIndex++}`);
                    queryParams.push(status);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }

                query += ' ORDER BY b.id ASC';

                const getResult = await pool.query(query, queryParams);
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                // Backend RBAC Check for POST (Create Booking) - Admin or Staff
                const postRole = req.body.role; // Assuming role is sent in body
                if (postRole !== 'admin' && postRole !== 'staff') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can add bookings.' });
                }

                // NEW: Destructure client_name and client_contact
                const { room_id, check_in_date, check_out_date, total_price, status: postStatus, client_name, client_contact } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO bookings (room_id, check_in_date, check_out_date, total_price, status, client_name, client_contact) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                    [room_id, check_in_date, check_out_date, total_price, postStatus, client_name, client_contact]
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                // Backend RBAC Check for PUT (Update Booking) - Admin or Staff
                const putRole = req.body.role; // Assuming role is sent in body
                if (putRole !== 'admin' && putRole !== 'staff') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can update bookings.' });
                }

                const { id: putId } = req.query;
                // NEW: Destructure client_name and client_contact
                const { room_id: putRoomId, check_in_date: putCheckInDate, check_out_date: putCheckOutDate, total_price: putTotalPrice, status: putStatus, client_name: putClientName, client_contact: putClientContact } = req.body;
                const putResult = await pool.query(
                    'UPDATE bookings SET room_id = $1, check_in_date = $2, check_out_date = $3, total_price = $4, status = $5, client_name = $6, client_contact = $7 WHERE id = $8 RETURNING *',
                    [putRoomId, putCheckInDate, putCheckOutDate, putTotalPrice, putStatus, putClientName, putClientContact, putId]
                );
                if (putResult.rows.length > 0) {
                    res.status(200).json(putResult.rows[0]);
                } else {
                    res.status(404).json({ message: 'Booking not found' });
                }
                break;

            case 'DELETE':
                // Backend RBAC Check for DELETE (Delete Booking) - Only Admin
                const deleteRole = req.query.role; // Assuming role is sent in query for DELETE
                if (deleteRole !== 'admin') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators can delete bookings.' });
                }

                const { id: deleteId } = req.query;
                const deleteResult = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    res.status(200).json({ message: 'Booking deleted successfully.' });
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
