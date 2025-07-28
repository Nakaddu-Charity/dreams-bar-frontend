// api/register.js - Vercel Serverless Function for User Registration (ES Module)

import { Pool } from 'pg';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

// Initialize PostgreSQL Pool globally
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

// This is the main function that Vercel will execute for /api/register requests
export default async (req, res) => {
    // Set CORS headers for all responses from this function
    res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method === 'POST') {
        const { username, password, role } = req.body;

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Default role if not provided, or ensure it's a valid role
            const userRole = role || 'staff';

            // Insert new user into the database
            const result = await pool.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
                [username, password_hash, userRole]
            );

            // Respond with the new user's non-sensitive information
            res.status(201).json({
                message: 'User registered successfully!',
                user: result.rows[0]
            });

        } catch (err) {
            console.error('Error during user registration:', err);
            if (err.code === '23505') { // PostgreSQL error code for unique violation
                return res.status(409).json({ message: 'Username already exists.' });
            }
            res.status(500).json({ message: 'An error occurred during registration.' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};
