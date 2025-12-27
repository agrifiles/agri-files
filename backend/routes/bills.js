// backend/routes/bills.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // your existing pool
// cache columns for bills table to avoid schema mismatch
let billsTableCols = null;
async function ensureBillsCols() {
  if (billsTableCols) return billsTableCols;
  try {
    const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='bills'");
    billsTableCols = r.rows.map(r => r.column_name);
  } catch (e) {
    console.error('Failed to read bills table columns', e);
    billsTableCols = [];
  }
  return billsTableCols;
}

router.get('/ping', (req, res) => res.json({ ok: true, msg: 'bills router alive' }));

// GET /api/bills/next-bill-no?owner_id=..&month=..&year=..
// Returns the next bill number for the given owner and month/year
// NEW LOGIC: Sequence resets only on 1st April (start of FY), continues throughout the financial year
// router.get('/next-bill-no', async (req, res) => {
//   try {
//     const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
//     const month = parseInt(req.query.month, 10); // 1-12
//     const year = parseInt(req.query.year, 10);   // e.g., 2025

//     if (!ownerId || !month || !year) {
//       return res.status(400).json({ success: false, error: 'owner_id, month, and year are required' });
//     }

//     // Month names for bill number format
//     const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
//     const monthStr = monthNames[month - 1];
//     const prefix = `${year}${monthStr}_`; // e.g., "2025DEC_"

//     // ===== NEW FY-BASED LOGIC =====
//     // Financial Year runs from April to March
//     // Determine FY start year: if month >= 4 (Apr-Dec), FY starts this year; if month <= 3 (Jan-Mar), FY started previous year
//     const fyStartYear = month >= 4 ? year : year - 1;
//     const fyEndYear = fyStartYear + 1;
    
//     // Build list of all month prefixes in this FY (Apr YYYY to Mar YYYY+1)
//     // FY months: Apr(4), May(5), Jun(6), Jul(7), Aug(8), Sep(9), Oct(10), Nov(11), Dec(12) of fyStartYear
//     //            Jan(1), Feb(2), Mar(3) of fyEndYear
//     const fyPrefixes = [];
//     // Apr to Dec of start year
//     for (let m = 4; m <= 12; m++) {
//       fyPrefixes.push(`${fyStartYear}${monthNames[m - 1]}_%`);
//     }
//     // Jan to Mar of end year
//     for (let m = 1; m <= 3; m++) {
//       fyPrefixes.push(`${fyEndYear}${monthNames[m - 1]}_%`);
//     }
    
//     // Find the latest bill_no for this owner across entire FY
//     // Use OR conditions to match any FY month prefix
//     const likeConditions = fyPrefixes.map((_, idx) => `bill_no LIKE $${idx + 2}`).join(' OR ');
//     const sql = `
//       SELECT bill_no FROM bills 
//       WHERE owner_id = $1 
//         AND (${likeConditions})
//       ORDER BY 
//         CASE 
//           WHEN bill_no ~ '^[0-9]{4}(APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)_' THEN 1
//           WHEN bill_no ~ '^[0-9]{4}(JAN|FEB|MAR)_' THEN 2
//         END,
//    CAST(SPLIT_PART(bill_no, '_', 2) AS INTEGER) DESC

//       LIMIT 1
//     `;
//     const { rows } = await pool.query(sql, [ownerId, ...fyPrefixes]);
// console.log( Date.now() ,'FY Prefixes:', fyPrefixes, 'SQL:', sql, 'Params:', [ownerId, ...fyPrefixes], 'Result Rows:', rows);
//     let nextSeq = 1;
//     if (rows.length > 0 && rows[0].bill_no) {
//       // Extract sequence from bill_no like "2025DEC_05"
//       const lastBillNo = rows[0].bill_no;
//       const parts = lastBillNo.split('_');
//       if (parts.length >= 2) {
//         const lastSeq = parseInt(parts[parts.length - 1], 10);
//         if (!isNaN(lastSeq)) {
//           nextSeq = lastSeq + 1;
//         }
//       }
//     }
//     // ===== END NEW FY-BASED LOGIC =====

//     /* ===== OLD MONTHLY RESET LOGIC (commented out) =====
//     // Find the latest bill_no for this owner with matching prefix (resets each month)
//     const sql = `
//       SELECT bill_no FROM bills 
//       WHERE owner_id = $1 
//         AND bill_no LIKE $2
//       ORDER BY bill_no DESC
//       LIMIT 1
//     `;
//     const { rows } = await pool.query(sql, [ownerId, `${prefix}%`]);

//     let nextSeq = 1;
//     if (rows.length > 0 && rows[0].bill_no) {
//       // Extract sequence from bill_no like "2025DEC_05"
//       const lastBillNo = rows[0].bill_no;
//       const parts = lastBillNo.split('_');
//       if (parts.length >= 2) {
//         const lastSeq = parseInt(parts[parts.length - 1], 10);
//         if (!isNaN(lastSeq)) {
//           nextSeq = lastSeq + 1;
//         }
//       }
//     }
//     ===== END OLD LOGIC ===== */

//     // Format: 2025DEC_01, 2025DEC_02, etc. (still uses current month in prefix)
//     const nextBillNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;

//     return res.json({ success: true, bill_no: nextBillNo, sequence: nextSeq, fy: `${fyStartYear}-${fyEndYear}` });
//   } catch (err) {
//     console.error('get next-bill-no err', err);
//     return res.status(500).json({ success: false, error: 'Server error' });
//   }
// });

router.get('/next-bill-no', async (req, res) => {
  try {
    const ownerId = parseInt(req.query.owner_id, 10);
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (!ownerId || !month || !year) {
      return res.status(400).json({ success: false, error: 'owner_id, month, and year are required' });
    }

    // FY logic: Financial Year runs April to March
    // If month >= 4 (Apr-Dec), FY starts this year; if month <= 3 (Jan-Mar), FY started previous year
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;

    // Query: Get the maximum bill_no (as integer) for this owner within the FY
    // Bill numbers are now simple sequential numbers: 01, 02, 03, etc.
    // FY boundary: April fyStartYear to March fyEndYear
    const sql = `
      SELECT MAX(CAST(bill_no AS INTEGER)) AS max_seq
      FROM bills
      WHERE owner_id = $1
        AND bill_no ~ '^[0-9]+$'
        AND (
          (EXTRACT(YEAR FROM bill_date) = $2 AND EXTRACT(MONTH FROM bill_date) >= 4)
          OR
          (EXTRACT(YEAR FROM bill_date) = $3 AND EXTRACT(MONTH FROM bill_date) < 4)
        )
    `;

    const { rows } = await pool.query(sql, [ownerId, fyStartYear, fyEndYear]);

    let nextSeq = (rows[0]?.max_seq ?? 0) + 1;

    // Format as simple sequential number: 01, 02, 03, ..., n
    const nextBillNo = String(nextSeq).padStart(2, '0');
console.log( Date.now() , 'next-bill-no:', nextBillNo, 'FY:', fyStartYear + '-' + fyEndYear, 'Rows:', rows);
    return res.json({
      success: true,
      bill_no: nextBillNo,
      sequence: nextSeq,
      fy: `${fyStartYear}-${fyEndYear}`
    });
  } catch (err) {
    console.error('get next-bill-no err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});


// GET /api/bills?owner_id=..&status=..&unlinked=1&file_id=..
router.get('/', async (req, res) => {
  try {
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
    const status = req.query.status || null;
    const unlinked = req.query.unlinked === '1' || req.query.unlinked === 'true';
    const fileId = req.query.file_id ? parseInt(req.query.file_id, 10) : null;
    const limit = parseInt(req.query.limit || '100', 10);
    const offset = parseInt(req.query.offset || '0', 10);

    const where = [];
    const params = [];
    let idx = 1;

    if (ownerId) {
      where.push(`owner_id = $${idx++}`);
      params.push(ownerId);
    }
    if (status) {
      where.push(`status = $${idx++}`);
      params.push(status);
    }
    if (unlinked) {
      where.push(`file_id IS NULL`);
    }
    if (fileId) {
      where.push(`file_id = $${idx++}`);
      params.push(fileId);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT * FROM bills
      ${whereSql}
      ORDER BY updated_at DESC, bill_date DESC, bill_id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(sql, params);
    return res.json({ success: true, bills: rows });
  } catch (err) {
    console.error('get bills err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/bills/:id (includes items)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('📋 GET /:id route hit with id:', id);
    const billRes = await pool.query('SELECT * FROM bills WHERE bill_id=$1 ORDER BY bill_id DESC', [id]);
    if (!billRes.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    const bill = billRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM bill_items WHERE bill_id=$1 ORDER BY product_id ASC', [id]);
    console.log('📋 Bill items query returned:', itemsRes.rows.length, 'items for bill_id:', id);
    bill.items = itemsRes.rows;
    return res.json({ success: true, bill });
  } catch (err) {
    console.error('get bill err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * Helper for computing item amount:
 * amount = qty * sales_rate (no gst included in amount here)
 * Backend stores amount as line total (taxable). GST can be derived.
 */

// POST /api/bills
// Body: { bill_no, bill_date, customer_name, customer_mobile, created_by, items: [ { product_id or product: {...}, description, qty, sales_rate, gst_percent, ... } ], file_id (optional) }
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};
    
    // Check if user is verified
    const owner_id = body.owner_id ?? body.created_by ?? null;
    if (owner_id) {
      const userCheck = await pool.query('SELECT is_verified FROM users WHERE id = $1', [owner_id]);
      if (!userCheck.rows[0] || !userCheck.rows[0].is_verified) {
        return res.status(403).json({ success: false, error: 'Account not verified', accountNotActive: true });
      }
    }

    // Debug: log incoming payload (trim to avoid huge logs)
    try { console.log('POST /api/bills payload:',
         JSON.stringify(body).slice(0, 2000)); } catch(e) { console.log('POST /api/bills payload: [unserializable]'); }
    // basic header fields
    const {
      bill_no = null,
      bill_date = null,
      farmer_name = null,
      farmer_mobile = null,
      created_by = req.body.created_by || null,
      file_id = null,
      status = 'draft',
      company_id = null,  // NEW: Company ID for proper bill-company relationship
      company_slot_no = null  // NEW: Company slot number (1, 2, or 3)
    } = body;
    // Support both 'items' and 'billItems' from frontend
    const items = body.items || body.billItems || [];
    // map owner_id for schemas that require it

    // validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      // return res.status(400).json({ success:false, error: 'items required' });
    }

    await client.query('BEGIN');

    // insert header - only include columns that actually exist in DB to avoid schema mismatch
    const cols = await ensureBillsCols();
    const headerVals = { bill_no, bill_date, farmer_name, farmer_mobile, file_id, status, created_by, owner_id, company_id, company_slot_no };
    const insertCols = [];
    const insertParams = [];
    Object.keys(headerVals).forEach((k) => {
      if (headerVals[k] === undefined || headerVals[k] === null) return; // skip nulls so defaults can apply
      if (cols.includes(k)) {
        insertCols.push(k);
        insertParams.push(headerVals[k]);
      }
    });
    // always include created_at/updated_at if present in table
    const includeTimestamps = cols.includes('created_at') && cols.includes('updated_at');

    let billRes;
    if (insertCols.length === 0) {
      // fallback: try inserting minimal to get an id (if DB has defaults)
      billRes = await client.query(`INSERT INTO bills DEFAULT VALUES RETURNING *`);
    } else {
      const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
      const colList = insertCols.join(', ');
      const sql = `INSERT INTO bills (${colList}${includeTimestamps ? ', created_at, updated_at' : ''}) VALUES (${placeholders}${includeTimestamps ? ', now(), now()' : ''}) RETURNING *`;
      billRes = await client.query(sql, insertParams);
    }
    const createdBill = billRes.rows[0];
    const bid = createdBill.bill_id;

    // insert items - handle possible creation of new product
    for (const it of items) {
      try { console.log('Processing item:', JSON.stringify(it).slice(0,500)); } catch(e) { console.log('Processing item: [unserializable]'); }
      let productId = it.product_id || null;
      if (!productId && it.product) {
        // user provided a new product object. Insert into products table.
        // map product fields to your products table columns; adjust column list as needed.
        const prod = it.product;
        const prodSql = `
          INSERT INTO products (name, hsn, batch_no, size, gov_rate, sales_rate, uom, gst_percent, created_by, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now()) RETURNING *
        `;
        const prodVals = [
          prod.name || prod.product_name || prod.description || 'custom',
          prod.hsn || null,
          prod.batch_no || null,
          prod.size || null,
          prod.gov_rate || null,
          prod.sales_rate || prod.sales_rate || 0,
          prod.uom || null,
          prod.gst_percent || prod.gst_percent || 0,
          created_by || null
        ];
        const pRes = await client.query(prodSql, prodVals);
        productId = pRes.rows[0].product_id ?? pRes.rows[0].id;
      }

      // compute amount
      const qty = parseFloat(it.qty || 0);
      const sales_rate = parseFloat(it.sales_rate || 0);
      const amount = Number((qty * sales_rate).toFixed(2));

      const itemSql = `
        INSERT INTO bill_items
        (bill_id, product_id, description, hsn, batch_no, cml_no, size, gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, $13, now(), now())
      `;
      const itemVals = [
        bid,
        productId,
        it.description || null,
        it.hsn || null,
        it.batch_no || null,
        it.cml_no || null,
        it.size || null,
        it.gov_rate || null,
        sales_rate,
        it.uom || null,
        it.gst_percent || 0,
        qty,
        amount
      ];
      await client.query(itemSql, itemVals);
    }

    // Calculate taxable_amount and total_amount from items
    const itemsRes = await client.query('SELECT amount, gst_percent FROM bill_items WHERE bill_id=$1', [bid]);
    let taxableAmount = 0;
    let totalAmount = 0;
    for (const item of itemsRes.rows) {
      const amt = parseFloat(item.amount || 0);
      const gstPct = parseFloat(item.gst_percent || 0);
      taxableAmount += amt;
      const gst = (gstPct / 100) * amt;
      totalAmount += amt + gst;
    }
    taxableAmount = Number(taxableAmount.toFixed(2));
    totalAmount = Number(totalAmount.toFixed(2));

    // Update bill with calculated totals
    await client.query(
      `UPDATE bills SET taxable_amount=$1, total_amount=$2, updated_at=now() WHERE bill_id=$3`,
      [taxableAmount, totalAmount, bid]
    );

    await client.query('COMMIT');

    // return created bill with updated totals
    const finalBill = await pool.query('SELECT * FROM bills WHERE bill_id=$1', [bid]);
    return res.status(201).json({ success: true, bill: finalBill.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ create bill err:', err);
    console.error('Error Stack:', err.stack);
    // Return error message to aid debugging in dev. Remove message leak in production.
    return res.status(500).json({ success: false, error: err.message || err.toString() || 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/bills/:id (update header and items — replace items set)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const { bill_no, bill_date, farmer_name, farmer_mobile, status = 'draft', created_by = req.body.created_by || null, company_id = null, company_slot_no = null } = req.body;
    
    // Check if user is verified
    const owner_id = req.body.owner_id ?? created_by ?? null;
    if (owner_id) {
      const userCheck = await pool.query('SELECT is_verified FROM users WHERE id = $1', [owner_id]);
      if (!userCheck.rows[0] || !userCheck.rows[0].is_verified) {
        return res.status(403).json({ success: false, error: 'Account not verified', accountNotActive: true });
      }
    }

    // Support both 'items' and 'billItems' from frontend
    const items = req.body.items || req.body.billItems || [];

    await client.query('BEGIN');

    // check exists
    const exist = await client.query('SELECT * FROM bills WHERE bill_id=$1', [id]);
    if (!exist.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    // Get available columns
    const cols = await ensureBillsCols();
    
    // Build UPDATE query dynamically based on available columns
    const updateFields = ['bill_no=$1', 'bill_date=$2', 'farmer_name=$3', 'farmer_mobile=$4', 'status=$5', 'updated_at=now()'];
    const updateParams = [bill_no, bill_date, farmer_name, farmer_mobile, status];
    
    let paramIndex = 6;
    if (cols.includes('company_id') && company_id !== null && company_id !== undefined) {
      updateFields.push(`company_id=$${paramIndex}`);
      updateParams.push(company_id);
      paramIndex++;
    }
    if (cols.includes('company_slot_no') && company_slot_no !== null && company_slot_no !== undefined) {
      updateFields.push(`company_slot_no=$${paramIndex}`);
      updateParams.push(company_slot_no);
      paramIndex++;
    }
    
    updateParams.push(id);
    const updateQuery = `UPDATE bills SET ${updateFields.join(', ')} WHERE bill_id=$${paramIndex}`;
    
    await client.query(updateQuery, updateParams);

    // delete old items and re-insert (simpler)
    await client.query('DELETE FROM bill_items WHERE bill_id=$1', [id]);

    for (const it of items) {
      let productId = it.product_id || null;
      if (!productId && it.product) {
        // create product
        const prod = it.product;
        const pRes = await client.query(
          `INSERT INTO products (name, hsn, batch_no, size, gov_rate, sales_rate, uom, gst_percent, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now()) RETURNING *`,
          [prod.name || prod.product_name || 'custom', prod.hsn || null, prod.batch_no || null, prod.size || null, prod.gov_rate || null, prod.sales_rate || 0, prod.uom || null, prod.gst_percent || 0, created_by || null]
        );
        productId = pRes.rows[0].product_id ?? pRes.rows[0].id;
      }

      const qty = parseFloat(it.qty || 0);
      const sales_rate = parseFloat(it.sales_rate || 0);
      const amount = Number((qty * sales_rate).toFixed(2));

      await client.query(
        `INSERT INTO bill_items (bill_id, product_id, description, hsn, batch_no, cml_no, size, gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), now())`,
        [id, productId, it.description || null, it.hsn || null, it.batch_no || null, it.cml_no || null, it.size || null, it.gov_rate || null, sales_rate, it.uom || null, it.gst_percent || 0, qty, amount]
      );
    }

    // Calculate totals after item update
    const itemsRes2 = await client.query('SELECT amount, gst_percent FROM bill_items WHERE bill_id=$1', [id]);
    let taxableAmount2 = 0;
    let totalAmount2 = 0;
    for (const item of itemsRes2.rows) {
      const amt = parseFloat(item.amount || 0);
      const gstPct = parseFloat(item.gst_percent || 0);
      taxableAmount2 += amt;
      const gst = (gstPct / 100) * amt;
      totalAmount2 += amt + gst;
    }
    taxableAmount2 = Number(taxableAmount2.toFixed(2));
    totalAmount2 = Number(totalAmount2.toFixed(2));

    // Update bill with calculated totals
    await client.query(
      `UPDATE bills SET taxable_amount=$1, total_amount=$2, updated_at=now() WHERE bill_id=$3`,
      [taxableAmount2, totalAmount2, id]
    );

    await client.query('COMMIT');

    const b = await pool.query('SELECT * FROM bills WHERE bill_id=$1', [id]);
    return res.json({ success: true, bill: b.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ update bill err:', err);
    console.error('Error Stack:', err.stack);
    return res.status(500).json({ success: false, error: err.message || err.toString() || 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/bills/:id/duplicate
router.post('/:id/duplicate', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    await client.query('BEGIN');

    const bRes = await client.query('SELECT * FROM bills WHERE bill_id=$1', [id]);
    if (!bRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    const bill = bRes.rows[0];

    // create new bill copy (keep status as draft)
    const newBillRes = await client.query(
      `INSERT INTO bills (bill_no, bill_date, farmer_name, farmer_mobile, file_id, status, created_by, owner_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now()) RETURNING *`,
      [bill.bill_no, bill.bill_date, bill.farmer_name, bill.farmer_mobile, null, 'draft', bill.created_by, bill.created_by]
    );
    const newId = newBillRes.rows[0].bill_id;

    // copy items
    const itemsRes = await client.query('SELECT * FROM bill_items WHERE bill_id=$1 ORDER BY product_id ASC', [id]);
    for (const it of itemsRes.rows) {
      await client.query(
        `INSERT INTO bill_items (bill_id, product_id, description, hsn, batch_no, cml_no, size, gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now(), now())`,
        [newId, it.product_id, it.description, it.hsn, it.batch_no, it.cml_no, it.size, it.gov_rate, it.sales_rate, it.uom, it.gst_percent, it.qty, it.amount]
      );
    }

    await client.query('COMMIT');
    return res.json({ success: true, new_bill_id: newId });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('duplicate bill err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/bills/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM bill_items WHERE bill_id=$1', [id]);
    await pool.query('DELETE FROM bills WHERE bill_id=$1', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('delete bill err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================================
// V2 ENDPOINTS - Type-safe bill management
// ============================================================================

const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const toString = (val) => {
  return val === null || val === undefined ? '' : String(val);
};

// GET /api/v2/bills?file_id=X&limit=1 (fetch by file_id)
router.get('/v2', async (req, res) => {
  try {
    const { file_id, owner_id, limit = 10 } = req.query;
    let sql = 'SELECT * FROM bills WHERE 1=1';
    let params = [];

    if (file_id) {
      sql += ` AND file_id = $${params.length + 1}`;
      params.push(toNumber(file_id));
    }
    if (owner_id) {
      sql += ` AND owner_id = $${params.length + 1}`;
      params.push(toNumber(owner_id));
    }

    sql += ` ORDER BY bill_id DESC LIMIT $${params.length + 1}`;
    params.push(toNumber(limit));

    const { rows } = await pool.query(sql, params);
    return res.json({ success: true, bills: rows });
  } catch (err) {
    console.error('Error fetching bills v2:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/v2/bills/:billId
router.get('/v2/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const billIdNum = toNumber(billId);

    if (!billIdNum) {
      return res.status(400).json({ success: false, error: 'Invalid billId' });
    }

    const billRes = await pool.query(
      'SELECT * FROM bills WHERE bill_id = $1',
      [billIdNum]
    );

    if (billRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    // Fetch bill items
    const itemsRes = await pool.query(
      'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY product_id ASC',
      [billIdNum]
    );

    console.log('📦 Bill items query result:', itemsRes.rows.length, 'items for bill_id:', billIdNum);

    const bill = billRes.rows[0];
    bill.items = itemsRes.rows.map(item => ({
      ...item,
      qty: toNumber(item.qty),
      gov_rate: toNumber(item.gov_rate),
      sales_rate: toNumber(item.sales_rate),
      gst_percent: toNumber(item.gst_percent),
      amount: toNumber(item.amount),
      product_id: toNumber(item.product_id)
    }));

    console.log('📦 Returning bill with', bill.items.length, 'items');

    return res.json({ success: true, bill });
  } catch (err) {
    console.error('Error fetching bill v2:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/v2/bills - Create new bill
router.post('/v2', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      file_id,
      owner_id,
      company_id,
      bill_no,
      bill_date,
      farmer_name,
      farmer_mobile,
      total_amount,
      taxable_amount,
      billItems
    } = req.body;

    const fileIdNum = toNumber(file_id);
    const ownerIdNum = toNumber(owner_id);
    const companyIdNum = toNumber(company_id);
    const totalAmountNum = toNumber(total_amount);
    const taxableAmountNum = toNumber(taxable_amount);

    if (!fileIdNum || !ownerIdNum || !companyIdNum) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    // Delete any existing bill for this file + company
    await client.query(
      'DELETE FROM bills WHERE file_id = $1 AND owner_id = $2 AND company_id = $3',
      [fileIdNum, ownerIdNum, companyIdNum]
    );

    // Create new bill
    const billRes = await client.query(
      `INSERT INTO bills (
        bill_no, bill_date, file_id, owner_id, company_id,
        farmer_name, farmer_mobile, total_amount, taxable_amount, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $4, NOW(), NOW())
      RETURNING *`,
      [
        bill_no || null,
        bill_date || new Date().toISOString().split('T')[0],
        fileIdNum,
        ownerIdNum,
        companyIdNum,
        farmer_name || '',
        farmer_mobile || '',
        totalAmountNum,
        taxableAmountNum
      ]
    );

    const createdBillId = billRes.rows[0].bill_id;

    // Insert bill items (only those with qty > 0)
    if (billItems && Array.isArray(billItems)) {
      for (const item of billItems) {
        const qty = toNumber(item.qty);
        if (qty > 0) {
          await client.query(
            `INSERT INTO bill_items (
              bill_id, product_id, description, hsn, batch_no, size,
              gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
            [
              createdBillId,
              toNumber(item.product_id),
              toString(item.description),
              toString(item.hsn),
              toString(item.batch_no),
              toString(item.size),
              toNumber(item.gov_rate),
              toNumber(item.sales_rate),
              toString(item.uom),
              toNumber(item.gst_percent),
              qty,
              toNumber(item.amount)
            ]
          );
        }
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      bill_id: createdBillId,
      message: 'Bill created successfully'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating bill v2:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/v2/bills/:billId - Update bill
router.put('/v2/:billId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { billId } = req.params;
    const { billItems, bill_date, farmer_name, farmer_mobile, total_amount, taxable_amount } = req.body;

    const billIdNum = toNumber(billId);
    if (!billIdNum) {
      return res.status(400).json({ success: false, error: 'Invalid billId' });
    }

    const totalAmountNum = toNumber(total_amount);
    const taxableAmountNum = toNumber(taxable_amount);

    await client.query('BEGIN');

    // Update bill header including amounts
    await client.query(
      `UPDATE bills 
       SET bill_date = COALESCE($1, bill_date),
           farmer_name = COALESCE($2, farmer_name),
           farmer_mobile = COALESCE($3, farmer_mobile),
           total_amount = $4,
           taxable_amount = $5,
           updated_at = NOW()
       WHERE bill_id = $6`,
      [bill_date || null, farmer_name || null, farmer_mobile || null, totalAmountNum, taxableAmountNum, billIdNum]
    );

    // Delete existing items and insert new ones
    await client.query('DELETE FROM bill_items WHERE bill_id = $1', [billIdNum]);

    if (billItems && Array.isArray(billItems)) {
      for (const item of billItems) {
        const qty = toNumber(item.qty);
        if (qty > 0) {
          await client.query(
            `INSERT INTO bill_items (
              bill_id, product_id, description, hsn, batch_no, size,
              gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
            [
              billIdNum,
              toNumber(item.product_id),
              toString(item.description),
              toString(item.hsn),
              toString(item.batch_no),
              toString(item.size),
              toNumber(item.gov_rate),
              toNumber(item.sales_rate),
              toString(item.uom),
              toNumber(item.gst_percent),
              qty,
              toNumber(item.amount)
            ]
          );
        }
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Bill updated successfully'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating bill v2:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

// ============================================================================
// POST /api/v2/bills/resequence-fy
// Resequence bills in a FY to fill gaps when a bill moves to another FY
// Body: { owner_id, fy_year }
// ============================================================================
router.post('/resequence-fy', async (req, res) => {
  const client = await pool.connect();
  try {
    const { owner_id, fy_year } = req.body;

    if (!owner_id || !fy_year) {
      return res.status(400).json({ success: false, error: 'owner_id and fy_year are required' });
    }

    await client.query('BEGIN');

    // Get all bills for this owner in this FY
    // FY year is the starting year (e.g., 2025 means Apr 2025 - Mar 2026)
    const startDate = new Date(fy_year, 3, 1); // Apr 1st of fy_year
    const endDate = new Date(fy_year + 1, 2, 31); // Mar 31st of fy_year+1

    const billsRes = await client.query(
      `SELECT bill_id, bill_no FROM bills 
       WHERE owner_id = $1 
         AND bill_date >= $2 
         AND bill_date <= $3
       ORDER BY CAST(bill_no AS INTEGER) ASC`,
      [owner_id, startDate, endDate]
    );

    const bills = billsRes.rows;

    if (bills.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'No bills to resequence' });
    }

    // Bill numbers are now simple sequential (01, 02, 03, etc.)
    // Just renumber them sequentially to fill any gaps

    // Resequence: renumber all bills to 01, 02, 03, etc.
    for (let i = 0; i < bills.length; i++) {
      const newSequence = String(i + 1).padStart(2, '0');

      console.log(`Resequencing: ${bills[i].bill_no} → ${newSequence}`);

      await client.query(
        `UPDATE bills SET bill_no = $1, updated_at = NOW() WHERE bill_id = $2`,
        [newSequence, bills[i].bill_id]
      );

      // Also update the file that links to this bill
      await client.query(
        `UPDATE files SET bill_no = $1, updated_at = NOW() WHERE bill_no = $2`,
        [newSequence, bills[i].bill_no]
      );
    }

    await client.query('COMMIT');

    console.log(`✅ Resequenced ${bills.length} bills for FY ${fy_year}`);

    return res.json({
      success: true,
      message: `Resequenced ${bills.length} bills`,
      billsUpdated: bills.length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Resequence FY error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
