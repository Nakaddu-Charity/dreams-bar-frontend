// api/inventory.js - Vercel Serverless Function for Inventory API (ES Module)

        import { Pool } from 'pg'; // Changed from require('pg')

        // Initialize PostgreSQL Pool using DATABASE_URL from Vercel Environment Variables
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Necessary for connecting to Supabase from Vercel
            }
        });

        // This is the main function that Vercel will execute for /api/inventory requests
        export default async (req, res) => { // Changed from module.exports
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
                        const getResult = await pool.query('SELECT * FROM inventory ORDER BY id ASC');
                        res.status(200).json(getResult.rows);
                        break;

                    case 'POST':
                        const { name, category_id, quantity, unit, cost_price, selling_price, reorder_level } = req.body;
                        const postResult = await pool.query(
                            'INSERT INTO inventory (name, category_id, quantity, unit, cost_price, selling_price, reorder_level) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                            [name, category_id, quantity, unit, cost_price, selling_price, reorder_level]
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
        