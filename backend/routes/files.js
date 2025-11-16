// routes/files.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // ensure path is correct and db.js exports pg Pool

// Simple ping to verify router is alive
router.get('/ping', (req, res) => {
  return res.json({ ok: true, msg: 'files router alive' });
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
    const userId = req.user?.id || null;
    const { title = null, form = {}, shapes = {} } = req.body;
    const mapped = mapFormToDb(form);
    const shapes_json = JSON.stringify(shapes || []);

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

module.exports = router;
