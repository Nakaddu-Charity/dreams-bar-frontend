// api/reports/summary.js - Vercel Serverless Function for Summary Reports (ES Module)

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

// This is the main function that Vercel will execute for /api/reports/summary requests
export default async (req, res) => {
    // Set CORS headers for all responses from this function
    res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS'); // Only GET for reports
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // RBAC Check for GET (Read Reports) - Admin or Staff
    // For GET requests, role is typically sent as a query parameter or header.
    // We'll assume it's sent as a query parameter for simplicity as we did for DELETE.
    const userRole = req.query.role;
    if (userRole !== 'admin' && userRole !== 'staff') {
        return res.status(403).json({ message: 'Forbidden: Only administrators or staff can view reports.' });
    }

    if (req.method === 'GET') {
        try {
            // 1. Calculate Total Revenue
            const totalRevenueResult = await pool.query(
                'SELECT COALESCE(SUM(total_price), 0) AS total_revenue FROM bookings WHERE status = $1',
                ['Completed'] // Only count revenue from completed bookings
            );
            const totalRevenue = parseFloat(totalRevenueResult.rows[0].total_revenue).toFixed(2);

            // 2. Count Bookings per Room Type
            const roomTypeBookingsResult = await pool.query(`
                SELECT
                    r.type AS room_type,
                    COUNT(b.id) AS booking_count
                FROM
                    bookings b
                JOIN
                    rooms r ON b.room_id = r.id
                GROUP BY
                    r.type
                ORDER BY
                    booking_count DESC;
            `);
            const roomTypeBookings = roomTypeBookingsResult.rows;

            // 3. Current Room Status (already on dashboard, but can be fetched here for consistency)
            const roomStatusResult = await pool.query(`
                SELECT
                    status,
                    COUNT(id) AS count
                FROM
                    rooms
                GROUP BY
                    status;
            `);
            const roomStatusSummary = roomStatusResult.rows.reduce((acc, curr) => {
                acc[curr.status] = parseInt(curr.count, 10);
                return acc;
            }, { Available: 0, Occupied: 0, Maintenance: 0 }); // Ensure all statuses are present

            res.status(200).json({
                totalRevenue,
                roomTypeBookings,
                roomStatusSummary
            });

        } catch (err) {
            console.error('Error fetching summary reports:', err);
            res.status(500).json({ message: 'An error occurred while fetching reports.' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};
