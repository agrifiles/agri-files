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
router.get('/next-bill-no', async (req, res) => {
  try {
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
    const month = parseInt(req.query.month, 10); // 1-12
    const year = parseInt(req.query.year, 10);   // e.g., 2025

    if (!ownerId || !month || !year) {
      return res.status(400).json({ success: false, error: 'owner_id, month, and year are required' });
    }

    // Month names for bill number format
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = monthNames[month - 1];
    const prefix = `${year}${monthStr}_`; // e.g., "2025DEC_"

    // Find the latest bill_no for this owner with matching prefix
    const sql = `
      SELECT bill_no FROM bills 
      WHERE owner_id = $1 
        AND bill_no LIKE $2
      ORDER BY bill_no DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [ownerId, `${prefix}%`]);

    let nextSeq = 1;
    if (rows.length > 0 && rows[0].bill_no) {
      // Extract sequence from bill_no like "2025DEC_05"
      const lastBillNo = rows[0].bill_no;
      const parts = lastBillNo.split('_');
      if (parts.length >= 2) {
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }

    // Format: 2025DEC_01, 2025DEC_02, etc.
    const nextBillNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;

    return res.json({ success: true, bill_no: nextBillNo, sequence: nextSeq });
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
      ORDER BY bill_date DESC, bill_id DESC
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
    const billRes = await pool.query('SELECT * FROM bills WHERE bill_id=$1', [id]);
    if (!billRes.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    const bill = billRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM bill_items WHERE bill_id=$1 ORDER BY item_id', [id]);
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
      items = [],
      file_id = null,
      status = 'draft'
    } = body;
    // map owner_id for schemas that require it
    const owner_id = body.owner_id ?? created_by ?? null;

    // validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      // return res.status(400).json({ success:false, error: 'items required' });
    }

    await client.query('BEGIN');

    // insert header - only include columns that actually exist in DB to avoid schema mismatch
    const cols = await ensureBillsCols();
    const headerVals = { bill_no, bill_date, farmer_name, farmer_mobile, file_id, status, created_by, owner_id };
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
    console.error('create bill err', err);
    // Return error message to aid debugging in dev. Remove message leak in production.
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/bills/:id (update header and items — replace items set)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const { bill_no, bill_date, farmer_name, farmer_mobile, status = 'draft', items = [], created_by = req.body.created_by || null } = req.body;

    await client.query('BEGIN');

    // check exists
    const exist = await client.query('SELECT * FROM bills WHERE bill_id=$1', [id]);
    if (!exist.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Not found' });
    }

    await client.query(
      `UPDATE bills SET bill_no=$1, bill_date=$2, farmer_name=$3, farmer_mobile=$4, status=$5, updated_at=now() WHERE bill_id=$6`,
      [bill_no, bill_date, farmer_name, farmer_mobile, status, id]
    );

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
    console.error('update bill err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
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
    const itemsRes = await client.query('SELECT * FROM bill_items WHERE bill_id=$1', [id]);
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

module.exports = router;
