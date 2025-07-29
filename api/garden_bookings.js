// api/garden_bookings.js - Vercel Serverless Function for Garden Bookings API (ES Module)

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

// This is the main function that Vercel will execute for /api/garden_bookings requests
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
                // RBAC Check for GET (Read Garden Bookings) - Admin or Staff
                const getRole = req.query.role;
                if (getRole !== 'admin' && getRole !== 'staff') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can view garden bookings.' });
                }

                const { search, status } = req.query;
                let query = 'SELECT * FROM garden_bookings';
                const queryParams = [];
                const conditions = [];
                let paramIndex = 1;

                if (search) {
                    // Search by client_name or purpose
                    conditions.push(`(client_name ILIKE $${paramIndex} OR purpose ILIKE $${paramIndex})`);
                    queryParams.push(`%${search}%`);
                    paramIndex++;
                }
                if (status) {
                    conditions.push(`status = $${paramIndex++}`);
                    queryParams.push(status);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }

                query += ' ORDER BY booking_date DESC, start_time ASC'; // Order by date then time

                const getResult = await pool.query(query, queryParams);
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                // RBAC Check for POST (Create Garden Booking) - Admin or Staff
                const postRole = req.body.role;
                if (postRole !== 'admin' && postRole !== 'staff') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can add garden bookings.' });
                }

                const { client_name, client_contact, booking_date, start_time, end_time, number_of_guests, purpose, total_price, status: postStatus } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO garden_bookings (client_name, client_contact, booking_date, start_time, end_time, number_of_guests, purpose, total_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
                    [client_name, client_contact, booking_date, start_time, end_time, number_of_guests, purpose, total_price, postStatus]
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                // RBAC Check for PUT (Update Garden Booking) - Admin or Staff
                const putRole = req.body.role;
                if (putRole !== 'admin' && putRole !== 'staff') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can update garden bookings.' });
                }

                const { id: putId } = req.query;
                const { client_name: putClientName, client_contact: putClientContact, booking_date: putBookingDate, start_time: putStartTime, end_time: putEndTime, number_of_guests: putNumberOfGuests, purpose: putPurpose, total_price: putTotalPrice, status: putStatus } = req.body;
                const putResult = await pool.query(
                    'UPDATE garden_bookings SET client_name = $1, client_contact = $2, booking_date = $3, start_time = $4, end_time = $5, number_of_guests = $6, purpose = $7, total_price = $8, status = $9 WHERE id = $10 RETURNING *',
                    [putClientName, putClientContact, putBookingDate, putStartTime, putEndTime, putNumberOfGuests, putPurpose, putTotalPrice, putStatus, putId]
                );
                if (putResult.rows.length > 0) {
                    res.status(200).json(putResult.rows[0]);
                } else {
                    res.status(404).json({ message: 'Garden booking not found' });
                }
                break;

            case 'DELETE':
                // RBAC Check for DELETE (Delete Garden Booking) - Only Admin
                const deleteRole = req.query.role;
                if (deleteRole !== 'admin') {
                    return res.status(403).json({ message: 'Forbidden: Only administrators can delete garden bookings.' });
                }

                const { id: deleteId } = req.query;
                const deleteResult = await pool.query('DELETE FROM garden_bookings WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    res.status(200).json({ message: 'Garden booking deleted successfully.' });
                } else {
                    res.status(404).json({ message: 'Garden booking not found' });
                }
                break;

            default:
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Error in garden_bookings API:', err);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};
