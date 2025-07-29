// api/daily_stock.js - Vercel Serverless Function for Daily Stock Management API (ES Module)

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

// Helper function to calculate derived stock values
const calculateStockDetails = (item) => {
    const opening = parseFloat(item.opening_stock || 0);
    const received = parseFloat(item.items_received || 0);
    const sold = parseFloat(item.items_sold_manual || 0);
    const wasted = parseFloat(item.items_taken_wasted || 0);
    const actual = parseFloat(item.closing_stock_actual || 0);

    const calculated = opening + received - sold - wasted;
    const variance = actual - calculated;

    return {
        closing_stock_calculated: calculated.toFixed(2),
        variance: variance.toFixed(2)
    };
};

// This is the main function that Vercel will execute for /api/daily_stock requests
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

    let client; // Declare client outside try-catch to ensure it's accessible in finally
    try {
        client = await pool.connect(); // Get a client from the pool

        const { role, userId } = req.query; // Get role and userId from query params for RBAC

        // All operations require authentication (user role check)
        if (!role || (role !== 'admin' && role !== 'staff')) {
            console.error('Unauthorized access attempt to daily_stock API. Role:', role);
            return res.status(403).json({ message: 'Forbidden: Authentication required and valid role needed.' });
        }

        switch (req.method) {
            case 'GET':
                // GET /api/daily_stock (list all records)
                if (!req.query.id) { // If no specific ID is requested, list all records
                    const { date_filter } = req.query;
                    let query = 'SELECT id, record_date, is_finalized, notes, created_at, updated_at FROM daily_stock_records';
                    const queryParams = [];
                    let paramIndex = 1;

                    if (date_filter) {
                        query += ` WHERE record_date = $${paramIndex++}`;
                        queryParams.push(date_filter);
                    }
                    query += ' ORDER BY record_date DESC, created_at DESC';

                    const result = await client.query(query, queryParams);
                    res.status(200).json(result.rows);
                } else { // GET /api/daily_stock/:recordId (get single record with details)
                    const { id: recordId } = req.query;
                    // Fetch the main record
                    const recordResult = await client.query(
                        'SELECT id, record_date, is_finalized, notes, created_at, updated_at FROM daily_stock_records WHERE id = $1',
                        [recordId]
                    );
                    if (recordResult.rows.length === 0) {
                        return res.status(404).json({ message: 'Daily stock record not found.' });
                    }
                    const record = recordResult.rows[0];

                    // Fetch associated item details with inventory item names
                    const itemDetailsResult = await client.query(
                        `SELECT
                            dsid.id,
                            dsid.daily_record_id,
                            dsid.inventory_item_id,
                            dsid.opening_stock,
                            dsid.items_received,
                            dsid.items_taken_wasted,
                            dsid.items_sold_manual,
                            dsid.closing_stock_actual,
                            dsid.closing_stock_calculated,
                            dsid.variance,
                            i.name AS inventory_item_name,
                            i.unit AS inventory_item_unit
                        FROM
                            daily_stock_item_details dsid
                        JOIN
                            inventory i ON dsid.inventory_item_id = i.id
                        WHERE
                            dsid.daily_record_id = $1
                        ORDER BY i.name ASC`,
                        [recordId]
                    );
                    record.items = itemDetailsResult.rows;
                    res.status(200).json(record);
                }
                break;

            case 'POST':
                // POST /api/daily_stock (create new record)
                if (req.url.endsWith('/items')) { // This path is handled by the specific /items endpoint
                    // This case should ideally not be hit if routing is correct, but for safety
                    return res.status(400).json({ message: 'Invalid request: Use PUT for daily stock item details.' });
                }

                if (role !== 'admin' && role !== 'staff') {
                    console.error('Forbidden access attempt to daily_stock POST by role:', role);
                    return res.status(403).json({ message: 'Forbidden: Only administrators or staff can create daily stock records.' });
                }

                const { record_date, notes } = req.body;
                // Check if a record for this date already exists
                const existingRecord = await client.query('SELECT id FROM daily_stock_records WHERE record_date = $1', [record_date]);
                if (existingRecord.rows.length > 0) {
                    return res.status(409).json({ message: `A daily stock record for ${record_date} already exists.` });
                }

                const newRecordResult = await client.query(
                    'INSERT INTO daily_stock_records (record_date, recorded_by_user_id, notes) VALUES ($1, $2, $3) RETURNING *',
                    [record_date, userId, notes]
                );
                const newRecord = newRecordResult.rows[0];

                // Automatically populate daily_stock_item_details for all active inventory items
                // with opening_stock from the previous day's closing_stock_actual, or 0 if no previous record.
                const inventoryItemsResult = await client.query('SELECT id, name FROM inventory WHERE is_active = TRUE ORDER BY name ASC');
                const inventoryItems = inventoryItemsResult.rows;

                const itemDetailsToInsert = [];
                for (const item of inventoryItems) {
                    let openingStock = 0;
                    // Try to get previous day's closing stock
                    const previousDayRecord = await client.query(
                        `SELECT dsid.closing_stock_actual
                         FROM daily_stock_records dsr
                         JOIN daily_stock_item_details dsid ON dsr.id = dsid.daily_record_id
                         WHERE dsr.record_date < $1 AND dsid.inventory_item_id = $2
                         ORDER BY dsr.record_date DESC
                         LIMIT 1`,
                        [record_date, item.id]
                    );
                    if (previousDayRecord.rows.length > 0) {
                        openingStock = parseFloat(previousDayRecord.rows[0].closing_stock_actual);
                    }

                    itemDetailsToInsert.push({
                        daily_record_id: newRecord.id,
                        inventory_item_id: item.id,
                        opening_stock: openingStock,
                        items_received: 0,
                        items_taken_wasted: 0,
                        items_sold_manual: 0,
                        closing_stock_actual: openingStock // Initialize actual to opening for now
                    });
                }

                if (itemDetailsToInsert.length > 0) {
                    const insertValues = itemDetailsToInsert.map(item =>
                        `('${item.daily_record_id}', ${item.inventory_item_id}, ${item.opening_stock}, ${item.items_received}, ${item.items_taken_wasted}, ${item.items_sold_manual}, ${item.closing_stock_actual})`
                    ).join(',');

                    await client.query(
                        `INSERT INTO daily_stock_item_details (daily_record_id, inventory_item_id, opening_stock, items_received, items_taken_wasted, items_sold_manual, closing_stock_actual)
                         VALUES ${insertValues}`
                    );
                }

                res.status(201).json(newRecord);
                break;

            case 'PUT':
                // PUT /api/daily_stock/:recordId (update main record details)
                const { id: putRecordId } = req.query;
                if (!putRecordId) {
                    return res.status(400).json({ message: 'Record ID is required for PUT operation.' });
                }

                if (req.url.endsWith('/items')) { // PUT /api/daily_stock/:recordId/items (batch update item details)
                    if (role !== 'admin' && role !== 'staff') {
                        console.error('Forbidden access attempt to daily_stock items PUT by role:', role);
                        return res.status(403).json({ message: 'Forbidden: Only administrators or staff can update daily stock item details.' });
                    }

                    const itemsToUpdate = req.body; // Expects an array of item details
                    if (!Array.isArray(itemsToUpdate) || itemsToUpdate.length === 0) {
                        return res.status(400).json({ message: 'Array of item details is required for batch update.' });
                    }

                    await client.query('BEGIN'); // Start transaction

                    const updatedItems = [];
                    for (const item of itemsToUpdate) {
                        const { id, daily_record_id, inventory_item_id, opening_stock, items_received, items_taken_wasted, items_sold_manual, closing_stock_actual } = item;

                        if (!daily_record_id || !inventory_item_id || opening_stock === undefined || items_received === undefined || items_taken_wasted === undefined || items_sold_manual === undefined || closing_stock_actual === undefined) {
                            throw new Error('Missing required fields for daily stock item detail update.');
                        }

                        const { closing_stock_calculated, variance } = calculateStockDetails(item);

                        let updateQuery;
                        let queryParams;

                        if (id) { // Existing item, update
                            updateQuery = `
                                UPDATE daily_stock_item_details
                                SET
                                    opening_stock = $1,
                                    items_received = $2,
                                    items_taken_wasted = $3,
                                    items_sold_manual = $4,
                                    closing_stock_actual = $5,
                                    closing_stock_calculated = $6,
                                    variance = $7
                                WHERE id = $8 AND daily_record_id = $9
                                RETURNING *;
                            `;
                            queryParams = [
                                opening_stock, items_received, items_taken_wasted, items_sold_manual,
                                closing_stock_actual, closing_stock_calculated, variance, id, daily_record_id
                            ];
                        } else { // New item for this record, insert
                            updateQuery = `
                                INSERT INTO daily_stock_item_details (
                                    daily_record_id, inventory_item_id, opening_stock, items_received,
                                    items_taken_wasted, items_sold_manual, closing_stock_actual,
                                    closing_stock_calculated, variance
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                                RETURNING *;
                            `;
                            queryParams = [
                                daily_record_id, inventory_item_id, opening_stock, items_received,
                                items_taken_wasted, items_sold_manual, closing_stock_actual,
                                closing_stock_calculated, variance
                            ];
                        }
                        const updateResult = await client.query(updateQuery, queryParams);
                        updatedItems.push(updateResult.rows[0]);
                    }

                    await client.query('COMMIT'); // Commit transaction
                    res.status(200).json(updatedItems);

                } else { // PUT /api/daily_stock/:recordId (update main record details)
                    const { notes: putNotes, is_finalized: putIsFinalized } = req.body;

                    // RBAC for finalizing: Only admin can finalize
                    if (putIsFinalized !== undefined && putIsFinalized === true && role !== 'admin') {
                        console.error('Forbidden access attempt to finalize daily_stock record by role:', role);
                        return res.status(403).json({ message: 'Forbidden: Only administrators can finalize daily stock records.' });
                    }
                    // RBAC for other updates: Admin or staff
                    if (putIsFinalized === undefined && role !== 'admin' && role !== 'staff') {
                         console.error('Forbidden access attempt to update daily_stock record by role:', role);
                         return res.status(403).json({ message: 'Forbidden: Only administrators or staff can update daily stock records.' });
                    }

                    const updateFields = [];
                    const updateParams = [];
                    let paramIndex = 1;

                    if (putNotes !== undefined) {
                        updateFields.push(`notes = $${paramIndex++}`);
                        updateParams.push(putNotes);
                    }
                    if (putIsFinalized !== undefined) {
                        updateFields.push(`is_finalized = $${paramIndex++}`);
                        updateParams.push(putIsFinalized);
                    }

                    if (updateFields.length === 0) {
                        return res.status(400).json({ message: 'No fields provided for update.' });
                    }

                    updateParams.push(putRecordId); // Add record ID for WHERE clause
                    const updateResult = await client.query(
                        `UPDATE daily_stock_records SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                        updateParams
                    );

                    if (updateResult.rows.length > 0) {
                        res.status(200).json(updateResult.rows[0]);
                    } else {
                        res.status(404).json({ message: 'Daily stock record not found' });
                    }
                }
                break;

            case 'DELETE':
                // DELETE /api/daily_stock/:recordId
                if (role !== 'admin') {
                    console.error('Forbidden access attempt to daily_stock DELETE by role:', role);
                    return res.status(403).json({ message: 'Forbidden: Only administrators can delete daily stock records.' });
                }

                const { id: deleteRecordId } = req.query;
                if (!deleteRecordId) {
                    return res.status(400).json({ message: 'Record ID is required for DELETE operation.' });
                }

                // The ON DELETE CASCADE on fk_daily_record will handle deleting item details
                const deleteResult = await client.query('DELETE FROM daily_stock_records WHERE id = $1 RETURNING id', [deleteRecordId]);
                if (deleteResult.rows.length > 0) {
                    res.status(200).json({ message: 'Daily stock record and its details deleted successfully.' });
                } else {
                    res.status(404).json({ message: 'Daily stock record not found' });
                }
                break;

            default:
                console.warn(`Method ${req.method} Not Allowed for /api/daily_stock`);
                res.status(405).json({ message: 'Method Not Allowed' });
                break;
        }
    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK'); // Rollback transaction on error
            } catch (rollbackErr) {
                console.error('Error during rollback:', rollbackErr);
            }
        }
        console.error('Unhandled error in daily_stock API:', err);
        // Handle specific PostgreSQL errors if needed
        if (err.code === '23505' && err.constraint === 'daily_stock_records_record_date_key') {
            return res.status(409).json({ message: `A daily stock record for this date already exists. Error: ${err.message}` });
        }
        if (err.code === '23503') { // Foreign key violation
            return res.status(409).json({ message: `Cannot perform action due to related data. Error: ${err.message}` });
        }
        res.status(500).json({ message: `An internal server error occurred: ${err.message || 'Unknown error'}` });
    } finally {
        if (client) {
            client.release(); // Release the client back to the pool
        }
    }
};
