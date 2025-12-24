// backend/routes/quotations.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Cache columns for quotation table to avoid schema mismatch
let quotationTableCols = null;
async function ensureQuotationCols() {
  if (quotationTableCols) return quotationTableCols;
  try {
    const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='quotation'");
    quotationTableCols = r.rows.map(r => r.column_name);
  } catch (e) {
    console.error('Failed to read quotation table columns', e);
    quotationTableCols = [];
  }
  return quotationTableCols;
}

router.get('/ping', (req, res) => res.json({ ok: true, msg: 'quotations router alive' }));

// GET /api/quotations/next-quotation-no?owner_id=..&month=..&year=..
// Returns the next quotation number for the given owner and month/year
router.get('/next-quotation-no', async (req, res) => {
  try {
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
    const month = parseInt(req.query.month, 10); // 1-12
    const year = parseInt(req.query.year, 10);   // e.g., 2025

    if (!ownerId || !month || !year) {
      return res.status(400).json({ success: false, error: 'owner_id, month, and year are required' });
    }

    // Month names for quotation number format
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = monthNames[month - 1];
    const prefix = `${year}${monthStr}_QT`; // e.g., "2025DEC_QT"

    // Find the latest quotation_no for this owner with matching prefix
    const sql = `
      SELECT quotation_no FROM quotation 
      WHERE owner_id = $1 
        AND quotation_no LIKE $2
      ORDER BY quotation_no DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [ownerId, `${prefix}%`]);

    let nextSeq = 1;
    if (rows.length > 0 && rows[0].quotation_no) {
      // Extract sequence from quotation_no like "2025DEC_QT05"
      const lastQuotationNo = rows[0].quotation_no;
      const match = lastQuotationNo.match(/_QT(\d+)$/);
      if (match) {
        const lastSeq = parseInt(match[1], 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }

    // Format: 2025DEC_QT01, 2025DEC_QT02, etc.
    const nextQuotationNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;

    return res.json({ success: true, quotation_no: nextQuotationNo, sequence: nextSeq });
  } catch (err) {
    console.error('get next-quotation-no err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/quotations?owner_id=..&status=..
router.get('/', async (req, res) => {
  try {
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id, 10) : null;
    const status = req.query.status || null;
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

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT * FROM quotation
      ${whereSql}
      ORDER BY updated_at DESC, quotation_date DESC, quotation_id DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(sql, params);
    return res.json({ success: true, quotations: rows });
  } catch (err) {
    console.error('get quotations err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/quotations/:id (includes items)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('📋 GET quotation/:id route hit with id:', id);
    const quotationRes = await pool.query('SELECT * FROM quotation WHERE quotation_id=$1', [id]);
    if (!quotationRes.rows[0]) return res.status(404).json({ success: false, error: 'Not found' });
    const quotation = quotationRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM quotation_items WHERE quotation_id=$1 ORDER BY item_id', [id]);
    console.log('📋 Quotation items query returned:', itemsRes.rows.length, 'items for quotation_id:', id);
    quotation.items = itemsRes.rows;
    return res.json({ success: true, quotation });
  } catch (err) {
    console.error('get quotation err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/quotations
// Body: { quotation_no, quotation_date, farmer_name, farmer_mobile, owner_id, items: [...], file_id (optional), company_id, company_slot_no, validity_days, notes }
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};
    
    const {
      quotation_no = null,
      quotation_date = null,
      farmer_name = null,
      farmer_mobile = null,
      owner_id = null,
      file_id = null,
      status = 'draft',
      company_id = null,
      company_slot_no = null,
      validity_days = 15,
      notes = null,
      terms_conditions = null,
      // Additional customer/farm fields
      aadhaar_no = null,
      farmer_id = null,
      village = null,
      taluka = null,
      district = null,
      crop_name = null,
      dripline_product = null,
      application_id = null,
      area8a = null,
      irrigation_area = null,
      lateral_spacing = null,
      sales_engg = null,
      company_name = null
    } = body;

    // Check if user is verified
    if (owner_id) {
      const userCheck = await pool.query('SELECT is_verified FROM users WHERE id = $1', [owner_id]);
      if (!userCheck.rows[0] || !userCheck.rows[0].is_verified) {
        return res.status(403).json({ success: false, error: 'Account not verified', accountNotActive: true });
      }
    }

    try { console.log('POST /api/quotations payload:', JSON.stringify(body).slice(0, 2000)); } catch(e) { console.log('POST /api/quotations payload: [unserializable]'); }

    const items = body.items || [];
    //const owner_id = body.owner_id || null;

    if (!owner_id) {
      return res.status(400).json({ success: false, error: 'owner_id is required' });
    }

    await client.query('BEGIN');

    // Calculate totals
    let taxable_amount = 0;
    let total_gst = 0;
    items.forEach(it => {
      const amount = parseFloat(it.amount || 0);
      const gstPercent = parseFloat(it.gst_percent || 0);
      taxable_amount += amount;
      total_gst += (gstPercent / 100) * amount;
    });
    const grand_total = Math.round((taxable_amount + total_gst) * 100) / 100;

    // Calculate valid_until date
    let valid_until = null;
    if (quotation_date && validity_days) {
      const d = new Date(quotation_date);
      d.setDate(d.getDate() + validity_days);
      valid_until = d.toISOString().split('T')[0];
    }

    // Insert quotation header
    const insertSql = `
      INSERT INTO quotation 
      (quotation_no, quotation_date, farmer_name, farmer_mobile, file_id, status, 
       company_id, company_slot_no, owner_id, validity_days, valid_until, 
       taxable_amount, total_gst, grand_total, notes, terms_conditions,
       aadhaar_no, farmer_id, village, taluka, district, crop_name, dripline_product, application_id,
       area8a, irrigation_area, lateral_spacing, sales_engg, company_name,
       created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, now(), now())
      RETURNING *
    `;
    const insertVals = [
      quotation_no, quotation_date, farmer_name, farmer_mobile, file_id, status,
      company_id, company_slot_no, owner_id, validity_days, valid_until,
      taxable_amount, total_gst, grand_total, notes, terms_conditions,
      aadhaar_no, farmer_id, village, taluka, district, crop_name, dripline_product, application_id,
      area8a, irrigation_area, lateral_spacing, sales_engg, company_name
    ];

    const quotationRes = await client.query(insertSql, insertVals);
    const createdQuotation = quotationRes.rows[0];
    const qid = createdQuotation.quotation_id;

    // Insert items
    for (const it of items) {
      const qty = parseFloat(it.qty || 0);
      const sales_rate = parseFloat(it.sales_rate || 0);
      const amount = Number((qty * sales_rate).toFixed(2));

      const itemSql = `
        INSERT INTO quotation_items
        (quotation_id, product_id, description, hsn, batch_no, cml_no, size, gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())
      `;
      const itemVals = [
        qid,
        it.product_id || null,
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

    await client.query('COMMIT');
    console.log('✅ Quotation created with id:', qid);
    return res.json({ success: true, quotation: createdQuotation });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create quotation err', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/quotations/:id
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.body || {};
    console.log('PUT /api/quotations/:id with id:', id);

    const owner_id = body.owner_id || null;

    // Check if user is verified
    if (owner_id) {
      const userCheck = await pool.query('SELECT is_verified FROM users WHERE id = $1', [owner_id]);
      if (!userCheck.rows[0] || !userCheck.rows[0].is_verified) {
        return res.status(403).json({ success: false, error: 'Account not verified', accountNotActive: true });
      }
    }

    const {
      quotation_no,
      quotation_date,
      farmer_name,
      farmer_mobile,
      file_id,
      status,
      company_id,
      company_slot_no,
      validity_days,
      notes,
      terms_conditions,
      // Additional customer/farm fields
      aadhaar_no,
      farmer_id,
      village,
      taluka,
      district,
      crop_name,
      dripline_product,
      application_id,
      area8a,
      irrigation_area,
      lateral_spacing,
      sales_engg,
      company_name
    } = body;

    const items = body.items || [];

    // Check if quotation exists
    const existing = await client.query('SELECT * FROM quotation WHERE quotation_id = $1', [id]);
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    await client.query('BEGIN');

    // Calculate totals
    let taxable_amount = 0;
    let total_gst = 0;
    items.forEach(it => {
      const amount = parseFloat(it.amount || 0);
      const gstPercent = parseFloat(it.gst_percent || 0);
      taxable_amount += amount;
      total_gst += (gstPercent / 100) * amount;
    });
    const grand_total = Math.round((taxable_amount + total_gst) * 100) / 100;

    // Calculate valid_until date
    let valid_until = null;
    if (quotation_date && validity_days) {
      const d = new Date(quotation_date);
      d.setDate(d.getDate() + validity_days);
      valid_until = d.toISOString().split('T')[0];
    }

    // Update quotation header
    const updateSql = `
      UPDATE quotation SET
        quotation_no = COALESCE($1, quotation_no),
        quotation_date = COALESCE($2, quotation_date),
        farmer_name = COALESCE($3, farmer_name),
        farmer_mobile = COALESCE($4, farmer_mobile),
        file_id = $5,
        status = COALESCE($6, status),
        company_id = $7,
        company_slot_no = $8,
        validity_days = COALESCE($9, validity_days),
        valid_until = $10,
        taxable_amount = $11,
        total_gst = $12,
        grand_total = $13,
        notes = $14,
        terms_conditions = $15,
        aadhaar_no = $16,
        farmer_id = $17,
        village = $18,
        taluka = $19,
        district = $20,
        crop_name = $21,
        dripline_product = $22,
        application_id = $23,
        area8a = $24,
        irrigation_area = $25,
        lateral_spacing = $26,
        sales_engg = $27,
        company_name = $28,
        updated_at = now()
      WHERE quotation_id = $29
      RETURNING *
    `;
    const updateVals = [
      quotation_no, quotation_date, farmer_name, farmer_mobile, file_id, status,
      company_id, company_slot_no, validity_days, valid_until,
      taxable_amount, total_gst, grand_total, notes, terms_conditions,
      aadhaar_no, farmer_id, village, taluka, district, crop_name, dripline_product, application_id,
      area8a, irrigation_area, lateral_spacing, sales_engg, company_name, id
    ];

    const quotationRes = await client.query(updateSql, updateVals);
    const updatedQuotation = quotationRes.rows[0];

    // Delete old items and insert new ones
    await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);

    for (const it of items) {
      const qty = parseFloat(it.qty || 0);
      const sales_rate = parseFloat(it.sales_rate || 0);
      const amount = Number((qty * sales_rate).toFixed(2));

      const itemSql = `
        INSERT INTO quotation_items
        (quotation_id, product_id, description, hsn, batch_no, cml_no, size, gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())
      `;
      const itemVals = [
        id,
        it.product_id || null,
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

    await client.query('COMMIT');
    console.log('✅ Quotation updated with id:', id);
    return res.json({ success: true, quotation: updatedQuotation });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('update quotation err', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

// PATCH /api/quotations/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }

    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const sql = 'UPDATE quotation SET status = $1, updated_at = now() WHERE quotation_id = $2 RETURNING *';
    const { rows } = await pool.query(sql, [status, id]);

    if (!rows[0]) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    return res.json({ success: true, quotation: rows[0] });
  } catch (err) {
    console.error('update quotation status err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/quotations/:id
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);

    await client.query('BEGIN');

    // Delete items first (if not using CASCADE)
    await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);

    // Delete quotation
    const { rowCount } = await client.query('DELETE FROM quotation WHERE quotation_id = $1', [id]);

    await client.query('COMMIT');

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    return res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('delete quotation err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/quotations/:id/delete (alternate delete endpoint to match files pattern)
router.post('/:id/delete', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);

    await client.query('BEGIN');
    await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM quotation WHERE quotation_id = $1', [id]);
    await client.query('COMMIT');

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    return res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('delete quotation err', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/quotations/:id/convert-to-bill
// Convert quotation to bill
router.post('/:id/convert-to-bill', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);

    // Get quotation with items
    const quotationRes = await client.query('SELECT * FROM quotation WHERE quotation_id = $1', [id]);
    if (!quotationRes.rows[0]) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    const quotation = quotationRes.rows[0];

    if (quotation.status === 'converted') {
      return res.status(400).json({ success: false, error: 'Quotation already converted to bill' });
    }

    const itemsRes = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [id]);
    const items = itemsRes.rows;

    await client.query('BEGIN');

    // Generate bill number from quotation number (2025DEC_QT01 -> 2025DEC_01)
    const bill_no = quotation.quotation_no.replace(/_QT(\d+)$/, '_$1');

    // Insert into bills table
    const billSql = `
      INSERT INTO bills 
      (bill_no, bill_date, farmer_name, farmer_mobile, file_id, status, company_id, company_slot_no,  owner_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9, now(), now())
      RETURNING *
    `;
    const billVals = [
      bill_no, quotation.quotation_date, quotation.farmer_name, quotation.farmer_mobile,
      quotation.file_id, quotation.company_id, quotation.company_slot_no, quotation.owner_id
    ];
    const billRes = await client.query(billSql, billVals);
    const bill = billRes.rows[0];
    const bid = bill.bill_id;

    // Copy items to bill_items
    for (const it of items) {
      const itemSql = `
        INSERT INTO bill_items
        (bill_id, product_id, description, hsn, batch_no, cml_no, size, gov_rate, sales_rate, uom, gst_percent, qty, amount, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())
      `;
      await client.query(itemSql, [
        bid, it.product_id, it.description, it.hsn, it.batch_no, it.cml_no, it.size,
        it.gov_rate, it.sales_rate, it.uom, it.gst_percent, it.qty, it.amount
      ]);
    }

    // Update quotation status
    await client.query(
      'UPDATE quotation SET status = $1, converted_to_bill_id = $2, converted_at = now(), updated_at = now() WHERE quotation_id = $3',
      ['converted', bid, id]
    );

    await client.query('COMMIT');
    console.log('✅ Quotation converted to bill. Quotation:', id, '-> Bill:', bid);
    return res.json({ success: true, bill, message: 'Quotation converted to bill successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('convert quotation to bill err', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
