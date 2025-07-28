// api/inventory.js - Vercel Serverless Function for Inventory API (ES Module)

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

// This is the main function that Vercel will execute for /api/inventory requests
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
                const { search, category_id } = req.query; // Extract search and category_id from query parameters
                let query = 'SELECT * FROM inventory';
                const queryParams = [];
                const conditions = [];
                let paramIndex = 1;

                if (search) {
                    // Use ILIKE for case-insensitive search on name
                    conditions.push(`name ILIKE $${paramIndex++}`);
                    queryParams.push(`%${search}%`);
                }
                if (category_id) {
                    conditions.push(`category_id = $${paramIndex++}`);
                    queryParams.push(category_id);
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }

                query += ' ORDER BY id ASC'; // Always order by ID

                const getResult = await pool.query(query, queryParams);
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                const { name, category_id: postCategoryId, quantity, unit, cost_price, selling_price, reorder_level } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO inventory (name, category_id, quantity, unit, cost_price, selling_price, reorder_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                    [name, postCategoryId, quantity, unit, cost_price, selling_price, reorder_level]
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                const { id: putId } = req.query;
                const { name: putName, category_id: putCategoryId, quantity: putQuantity, unit: putUnit, cost_price: putCostPrice, selling_price: putSellingPrice, reorder_level: putReorderLevel } = req.body;
                const putResult = await pool.query(
                    'UPDATE inventory SET name = $1, category_id = $2, quantity = $3, unit = $4, cost_price = $5, selling_price = $6, reorder_level = $7 WHERE id = $8 RETURNING *',
                    [putName, putCategoryId, putQuantity, putUnit, putCostPrice, putSellingPrice, putReorderLevel, putId]
                );
                if (putResult.rows.length > 0) {
                    res.status(200).json(putResult.rows[0]);
                } else {
                    res.status(404).json({ message: 'Item not found' });
                }
                break;

            case 'DELETE':
                const { id: deleteId } = req.query;
                const deleteResult = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    res.status(204).end();
                } else {
                    res.status(404).json({ message: 'Item not found' });
                }
                break;

            default:
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Error in inventory API:', err);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};
