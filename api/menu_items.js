// api/menu_items.js - Vercel Serverless Function for Menu Items API (ES Module)

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

// This is the main function that Vercel will execute for /api/menu_items requests
export default async (req, res) => {
    // Set CORS headers for all responses from this function
    res.setHeader('Access-Control-Allow-Origin', 'https://dreams-bar-frontend.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/json'); // Ensure JSON content type is always set

    // Handle OPTIONS method for CORS preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        switch (req.method) {
            case 'GET':
                // RBAC Check for GET (Read Menu Items) - Admin or Staff
                const getRole = req.query.role;
                if (getRole !== 'admin' && getRole !== 'staff') {
                    console.error('Forbidden access attempt to menu_items GET by role:', getRole);
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can view menu items.' });
                }

                const { search, category_id, is_available } = req.query;
                let query = `
                    SELECT
                        mi.id,
                        mi.name,
                        mi.description,
                        mi.price,
                        mi.category_id,
                        mi.is_available,
                        mi.created_at,
                        mi.updated_at,
                        c.name AS category_name
                    FROM
                        menu_items mi
                    LEFT JOIN
                        categories c ON mi.category_id = c.id
                `;
                const queryParams = [];
                const conditions = [];
                let paramIndex = 1;

                if (search) {
                    conditions.push(`(mi.name ILIKE $${paramIndex} OR mi.description ILIKE $${paramIndex})`);
                    queryParams.push(`%${search}%`);
                    paramIndex++;
                }
                if (category_id) {
                    conditions.push(`mi.category_id = $${paramIndex++}`);
                    queryParams.push(parseInt(category_id, 10)); // Ensure category_id is parsed as integer
                }
                if (is_available !== undefined) {
                    conditions.push(`mi.is_available = $${paramIndex++}`);
                    queryParams.push(is_available === 'true'); // Convert string 'true'/'false' to boolean
                }

                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }

                query += ' ORDER BY mi.name ASC';

                const getResult = await pool.query(query, queryParams);
                res.status(200).json(getResult.rows);
                break;

            case 'POST':
                // RBAC Check for POST (Create Menu Item) - Only Admin
                const postRole = req.body.role;
                if (postRole !== 'admin') {
                    console.error('Forbidden access attempt to menu_items POST by role:', postRole);
                    return res.status(403).json({ message: 'Forbidden: Only administrators can add menu items.' });
                }

                const { name, description, price, category_id: postCategoryId, is_available } = req.body;
                const postResult = await pool.query(
                    'INSERT INTO menu_items (name, description, price, category_id, is_available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                    [name, description, price, postCategoryId ? parseInt(postCategoryId, 10) : null, is_available] // Parse category_id to int, handle null
                );
                res.status(201).json(postResult.rows[0]);
                break;

            case 'PUT':
                // RBAC Check for PUT (Update Menu Item) - Only Admin
                const putRole = req.body.role;
                if (putRole !== 'admin') {
                    console.error('Forbidden access attempt to menu_items PUT by role:', putRole);
                    return res.status(403).json({ message: 'Forbidden: Only administrators can update menu items.' });
                }

                const { id: putId } = req.query;
                const { name: putName, description: putDescription, price: putPrice, category_id: putCategoryId, is_available: putIsAvailable } = req.body;
                const putResult = await pool.query(
                    'UPDATE menu_items SET name = $1, description = $2, price = $3, category_id = $4, is_available = $5 WHERE id = $6 RETURNING *',
                    [putName, putDescription, putPrice, putCategoryId ? parseInt(putCategoryId, 10) : null, putIsAvailable, putId] // Parse category_id to int, handle null
                );
                if (putResult.rows.length > 0) {
                    res.status(200).json(putResult.rows[0]);
                } else {
                    res.status(404).json({ message: 'Menu item not found' });
                }
                break;

            case 'DELETE':
                // RBAC Check for DELETE (Delete Menu Item) - Only Admin
                const deleteRole = req.query.role;
                if (deleteRole !== 'admin') {
                    console.error('Forbidden access attempt to menu_items DELETE by role:', deleteRole);
                    return res.status(403).json({ message: 'Forbidden: Only administrators can delete menu items.' });
                }

                const { id: deleteId } = req.query;
                const deleteResult = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [deleteId]);
                if (deleteResult.rows.length > 0) {
                    res.status(200).json({ message: 'Menu item deleted successfully.' });
                } else {
                    res.status(404).json({ message: 'Menu item not found' });
                }
                break;

            default:
                console.warn(`Method ${req.method} Not Allowed for /api/menu_items`);
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        console.error('Unhandled error in menu_items API:', err); // Log the full error
        // Handle unique constraint violation for name
        if (err.code === '23505' && err.constraint === 'menu_items_name_key') {
            return res.status(409).json({ message: 'A menu item with this name already exists.' });
        }
        res.status(500).json({ message: `An internal server error occurred: ${err.message || 'Unknown error'}` });
    }
};
