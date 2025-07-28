// api/categories.js - Vercel Serverless Function for Categories API (ES Module)

        import { Pool } from 'pg'; // Changed from require('pg')

        // Initialize PostgreSQL Pool using DATABASE_URL from Vercel Environment Variables
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Necessary for connecting to Supabase from Vercel
            }
        });

        // This is the main function that Vercel will execute for /api/categories requests
        export default async (req, res) => { // Changed from module.exports
            // Set CORS headers for all responses from this function
            res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS'); // Categories only needs GET
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');

            // Handle OPTIONS method for CORS preflight requests
            if (req.method === 'OPTIONS') {
                return res.status(204).end();
            }
