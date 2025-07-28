// api/login.js - Vercel Serverless Function for User Login (ES Module)

import { Pool } from 'pg';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password comparison

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

// This is the main function that Vercel will execute for /api/login requests
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
        const { username, password } = req.body;

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        try {
            // Find the user by username
            const userResult = await pool.query(
                'SELECT id, username, password_hash, role FROM users WHERE username = $1',
                [username]
            );

            const user = userResult.rows[0];

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            // Compare the provided password with the stored hash
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            // If login is successful, return user info (without password hash)
            // In a real application, you would generate and return a JWT here.
            res.status(200).json({
                message: 'Login successful!',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (err) {
            console.error('Error during user login:', err);
            res.status(500).json({ message: 'An error occurred during login.' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};
                       