// routes/files.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // ensure path is correct and db.js exports pg Pool

// Simple ping to verify router is alive
router.get('/ping', (req, res) => {
  return res.json({ ok: true, msg: 'files router alive' });
});

// GET /api/files/companies/list/:userId - Get user's linked companies from company_link table
router.get('/companies/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Query company_link table to get companies linked to this user
    const { rows } = await pool.query(
      `SELECT 
        cl.link_id,
        cl.company_id,
        cl.user_id,
        cl.company_slot,
        cl.designation,
        cl.engineer_name,
        co.company_name,
        co.mobile
       FROM company_link cl
       JOIN company_oem co ON cl.company_id = co.company_id
       WHERE cl.user_id = $1
       ORDER BY cl.company_slot ASC`,
      [userId]
    );

    return res.json({ success: true, companies: rows });
  } catch (err) {
    console.error('fetch user companies err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/files/products/:userId - Get products for billing (filter by user and optionally by company)
router.get('/products/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.query;
    
    console.log('=== GET /api/files/products DEBUG ===');
    console.log('userId from params:', userId, 'Type:', typeof userId);
    console.log('companyId from query:', companyId, 'Type:', typeof companyId);
    
    if (!userId || userId === 'null' || userId === 'undefined') {
      console.error('❌ userId is missing or invalid');
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    if (companyId) {
      // Filter by both user AND company (spare1 = userId AND spare2 = companyId)
      const userIdText = String(userId);
      const companyIdText = String(companyId);
      
      console.log(`✅ Fetching products for userId=${userIdText}, companyId=${companyIdText}`);
      
      const query = `
        SELECT *
        FROM products
        WHERE is_deleted = FALSE
          AND spare1 = $1
          AND spare2 = $2
        ORDER BY product_id DESC
      `;
      const result = await pool.query(query, [userIdText, companyIdText]);
      console.log(`Found ${result.rows.length} products for user+company`);
      return res.json({ success: true, products: result.rows });
    } else {
      // Filter by user only (spare1 = userId OR spare1 = 'master_User')
      const userIdText = String(userId);
      
      console.log(`✅ Fetching products for userId=${userIdText} (with master_User)`);
      
      const query = `
        SELECT *
        FROM products
        WHERE is_deleted = FALSE
          AND (spare1 = $1 OR spare1 = 'master_User')
        ORDER BY product_id DESC
      `;
      const result = await pool.query(query, [userIdText]);
      console.log(`Found ${result.rows.length} products for user`);
      console.log('Sample products spare1 values:', result.rows.slice(0, 3).map(p => ({ product_id: p.product_id, spare1: p.spare1 })));
      return res.json({ success: true, products: result.rows });
    }
  } catch (err) {
    console.error('fetch products err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Map front-end form keys to DB column names
function mapFormToDb(form = {}) {
  return {
    fy_year: form.fyYear || null,
    company: form.company || null,
    application_id: form.applicationId || null,
    farmer_id: form.farmerId || null,
    farmer_name: form.farmerName || null,
    father_name: form.fatherName || null,
    mobile: form.mobile || null,
    aadhaar_no: form.aadhaarNo || null,
    quotation_no: form.quotationNo || null,
    quotation_date: form.quotationDate || null,
    bill_no: form.billNo || null,
    bill_date: form.billDate || null,
    village: form.village || null,
    taluka: form.taluka || null,
    district: form.district || null,
    area8a: form.area8A || null,
    gut_no: form.gutNo || null,
    crop_name: form.cropName || null,
    irrigation_area: form.irrigationArea || null,
    lateral_spacing: form.lateralSpacing || null,
    dripline_product: form.driplineProduct || null,
    dripper_discharge: form.dripperDischarge || null,
    dripper_spacing: form.dripperSpacing || null,
    plane_lateral_qty: form.planeLateralQty || null,
    sales_engg: form.salesEngg || null,
    pump_type: form.pumpType || null,
    two_nozzel_distance: form.twoNozzelDistance || null,
    bill_amount: form.billAmount || null,
    w1_name: form.w1Name || null,
    w1_village: form.w1Village || null,
    w1_taluka: form.w1Taluka || null,
    w1_district: form.w1District || null,
    w2_name: form.w2Name || null,
    w2_village: form.w2Village || null,
    w2_taluka: form.w2Taluka || null,
    w2_district: form.w2District || null,
    place: form.place || null,
    file_date: form.fileDate || null
  };
}

// POST /api/files  -> create new file
router.post('/', async (req, res) => {
  try {
    // If you have auth middleware, req.user.id can be used as owner_id
    const userId = req.body.owner_id || null;
    const { title = null, form = {}, shapes = {} } = req.body;
    const mapped = mapFormToDb(form);
    const shapes_json = JSON.stringify(shapes || []);

    console.log('=== FILE CREATE - BACKEND DEBUG ===');
    console.log('User ID:', userId);
    console.log('Title:', title);
    console.log('Shapes count:', Array.isArray(shapes) ? shapes.length : 0);
    if (Array.isArray(shapes) && shapes.length > 0) {
      console.log('Shape types:', shapes.map(s => s.type).join(', '));
      console.log('First shape:', shapes[0]);
      console.log('Last shape:', shapes[shapes.length - 1]);
    }
    console.log('Shapes JSON length:', shapes_json.length);
    console.log('=== END BACKEND DEBUG ===');

    const fields = ['owner_id', 'title', 'shapes_json', ...Object.keys(mapped)];
    const values = [userId, title, shapes_json, ...Object.values(mapped)];
    const params = values.map((_, i) => `$${i + 1}`).join(',');

    const sql = `INSERT INTO files (${fields.join(',')}) VALUES (${params}) RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return res.status(201).json({ success: true, file: rows[0] });
  } catch (err) {
    console.error('create file err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/files/:id  -> update existing file (partial update OK)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // Optional: check ownership (uncomment to enforce)
    // const ownerCheck = await pool.query('SELECT owner_id FROM files WHERE id=$1', [id]);
    // if (!ownerCheck.rows[0]) return res.status(404).json({ success:false, error:'File not found' });
    // if (ownerCheck.rows[0].owner_id !== userId) return res.status(403).json({ success:false, error:'Forbidden' });

    const { title, form = {}, shapes } = req.body;
    const mapped = mapFormToDb(form);

    console.log('=== FILE UPDATE - BACKEND DEBUG ===');
    console.log('File ID:', id);
    console.log('Shapes count:', Array.isArray(shapes) ? shapes.length : 0);
    if (Array.isArray(shapes) && shapes.length > 0) {
      console.log('Shape types:', shapes.map(s => s.type).join(', '));
      console.log('First shape:', shapes[0]);
    }
    console.log('=== END UPDATE DEBUG ===');

    const updates = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title=$${idx++}`); values.push(title); }
    if (shapes !== undefined) { updates.push(`shapes_json=$${idx++}`); values.push(JSON.stringify(shapes)); }

    // include only non-null fields provided in the incoming form object
    for (const [k, v] of Object.entries(mapped)) {
      if (v !== null) {
        updates.push(`${k}=$${idx++}`);
        values.push(v);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id); // last param for WHERE
    const sql = `UPDATE files SET ${updates.join(',')}, updated_at=now() WHERE id=$${idx} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return res.json({ success: true, file: rows[0] });
  } catch (err) {
    console.error('update file err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/files/:id/delete - Soft delete (sets status to 'deleted')
router.post('/:id/delete', async (req, res) => {
  try {
    console.log('Soft delete request for file id:', req.params.id);
    const id = req.params.id;
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
    
    // Soft delete: set status to 'deleted'
    const result = await pool.query(
      'UPDATE files SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id',
      ['deleted', id]
    );

    console.log('✅ File soft deleted (id):', id);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    return res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('❌ Soft delete file err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/files/:id  -> fetch file (handy for rehydration)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM files WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, file: rows[0] });
  } catch (err) {
    console.error('get file err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/files/:id/link-bill
// Body: { bill_id }
router.post('/:id/link-bill', async (req, res) => {
  try {
    const { id } = req.params;
    const { bill_id } = req.body;
    
    console.log('Link-bill request: fileId=', id, 'billId=', bill_id, 'type=', typeof bill_id);
    
    if (!bill_id) {
      return res.status(400).json({ success: false, error: 'bill_id required' });
    }

    // Verify file exists
    const fRes = await pool.query('SELECT id, bill_no, bill_date FROM files WHERE id=$1', [id]);
    if (!fRes.rows[0]) {
      console.log('File not found with id:', id);
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    const fileRow = fRes.rows[0];

    // Verify bill exists in bills table
    const bRes = await pool.query(
      `SELECT bill_id, bill_no, bill_date, farmer_name, farmer_mobile FROM bills WHERE bill_id=$1`,
      [bill_id]
    );
    if (!bRes.rows[0]) {
      console.log('Bill not found with bill_id:', bill_id);
      return res.status(404).json({ success: false, error: 'Bill not found in bills table' });
    }
    const billRow = bRes.rows[0];
    const actualBillId = billRow.bill_id;

    console.log('Found bill:', actualBillId, 'with details:', billRow);

    // Update file: copy bill details (bill_no, bill_date), set status to final
    // (files table links to bills via the bill_no field, not bill_id)
    const upd = await pool.query(
      `UPDATE files SET bill_no=$1, bill_date=$2, status=$3, updated_at=now() WHERE id=$4 RETURNING *`,
      [billRow.bill_no, billRow.bill_date, 'final', id]
    );

    if (!upd.rows[0]) {
      console.log('Failed to update file');
      return res.status(500).json({ success: false, error: 'Failed to update file' });
    }

    // Also update bill: set file_id and status to final (this creates the bidirectional link)
    await pool.query(
      `UPDATE bills SET file_id=$1, status=$2, updated_at=now() WHERE bill_id=$3`,
      [id, 'final', actualBillId]
    );

    console.log('Successfully linked bill', actualBillId, 'to file', id);
    return res.json({ success: true, file: upd.rows[0] });
  } catch (err) {
    console.error('link-bill err:', err);
    return res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
    const status = req.query.status || null;
    const q = req.query.q ? String(req.query.q).trim() : null;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const offset = parseInt(req.query.offset || '0', 10);

    // build where clauses dynamically
    const where = [];
    const params = [];
    let idx = 1;

    // Always exclude deleted files unless specifically querying for deleted status
    if (!status || status !== 'deleted') {
      where.push(`status != 'deleted'`);
    }

    if (ownerId) {
      where.push(`owner_id = $${idx++}`);
      params.push(ownerId);
    }
    if (status) {
      where.push(`status = $${idx++}`);
      params.push(status);
    }
    if (q) {
      // simple ilike search on farmer_name, village and bill_no
      where.push(`(farmer_name ILIKE $${idx} OR village ILIKE $${idx} OR bill_no::text ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    console.log("route",ownerId , status, q )

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // count total
    const countSql = `SELECT COUNT(*)::int AS total FROM files ${whereSql}`;
    const countRes = await pool.query(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    // fetch rows (latest first)
    const dataSql = `
      SELECT *
      FROM files
      ${whereSql}
      ORDER BY updated_at DESC NULLS LAST, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const dataRes = await pool.query(dataSql, params);

    return res.json({ success: true, files: dataRes.rows, total });
  } catch (err) {
    console.error('get files err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * GET /api/files/:id
 * Returns a single file (used for rehydration in the edit page)
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { rows } = await pool.query('SELECT * FROM files WHERE id=$1', [id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, file: rows[0] });
  } catch (err) {
    console.error('get file by id err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});


// POST /api/files/:id/delete - Soft delete (sets status to 'deleted')

module.exports = router;
