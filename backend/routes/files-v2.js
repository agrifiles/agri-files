// routes/files-v2.js
// Fresh, robust logic for file management with proper bill handling
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================================
// UTILITY: Type conversion helpers
// ============================================================================
const toNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const toString = (val) => {
  return val === null || val === undefined ? '' : String(val);
};

// ============================================================================
// UTILITY: Map frontend form keys to database column names
// Based on actual files table schema
// ============================================================================
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
    bill_amount: (form.billAmount !== null && form.billAmount !== undefined && form.billAmount !== '') ? Number(form.billAmount) : null,
    // Bank details
    bank_name: form.bankName || null,
    account_name: form.accountName || null,
    account_number: form.accountNumber || null,
    ifsc: form.ifsc || null,
    // Common area fields
    is_common_area: form.isCommonArea ?? false,
    scheme_name: form.schemeName || null,
    giver_names: form.giverNames || null,
    // W1 witness fields
    w1_name: form.w1Name || null,
    w1_village: form.w1Village || null,
    w1_taluka: form.taluka || null,  // Same as farmer taluka
    w1_district: form.district || null,  // Same as farmer district
    // W2 witness fields
    w2_name: form.w2Name || null,
    w2_village: form.w2Village || null,
    w2_taluka: form.taluka || null,  // Same as farmer taluka
    w2_district: form.district || null,  // Same as farmer district
    place: form.place || null,
    file_date: form.fileDate || null,
    // File type field
    file_type: form.fileType || null
  };
}

// ============================================================================
// 1. GET /api/v2/files/context/:userId
// Returns: user's company links + all their products
// ============================================================================
router.get('/context/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = toNumber(userId);

    if (!userIdNum) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    // Fetch user's company links (max 3)
    const companyLinksRes = await pool.query(
      `SELECT 
        cl.link_id, cl.company_id, cl.company_slot, 
        cl.designation, cl.engineer_name, cl.mobile,
        co.company_name
       FROM company_link cl
       JOIN company_oem co ON cl.company_id = co.company_id
       WHERE cl.user_id = $1
       ORDER BY cl.company_slot ASC`,
      [userIdNum]
    );

    const companyLinks = companyLinksRes.rows;

    return res.json({ 
      success: true, 
      userId: userIdNum,
      companyLinks 
    });
  } catch (err) {
    console.error('Error fetching context:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================================
// 2. GET /api/v2/files/products/:userId?companyId=X
// Returns: all products for user+company with proper type conversion
// spare1 = userId, spare2 = companyId, spare3 = companySlot
// ============================================================================
router.get('/products/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.query;

    const userIdNum = toNumber(userId);
    const companyIdNum = companyId ? toNumber(companyId) : null;

    if (!userIdNum) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    if (!companyIdNum) {
      return res.status(400).json({ success: false, error: 'companyId is required' });
    }

    // Fetch products for this user + company
    const userIdStr = toString(userIdNum);
    const companyIdStr = toString(companyIdNum);

    const productsRes = await pool.query(
      `SELECT *
       FROM products
       WHERE is_deleted = FALSE
         AND spare1 = $1
         AND spare2 = $2
       ORDER BY product_id DESC`,
      [userIdStr, companyIdStr]
    );

    // Type conversion for numeric fields
    const products = productsRes.rows.map(p => ({
      ...p,
      product_id: toNumber(p.product_id),
      qty: toNumber(p.qty),
      gov_rate: toNumber(p.gov_rate),
      company_rate: toNumber(p.company_rate),
      selling_rate: toNumber(p.selling_rate),
      sgst: toNumber(p.sgst),
      cgst: toNumber(p.cgst)
    }));

    return res.json({ 
      success: true, 
      userId: userIdNum,
      companyId: companyIdNum,
      products 
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================================
// 2B. GET /api/v2/files/products?companyId=X&userId=Y
// Alternative endpoint that accepts companyId + userId as query params
// ============================================================================
router.get('/products', async (req, res) => {
  try {
    const { companyId, userId } = req.query;

    const companyIdNum = companyId ? toNumber(companyId) : null;
    const userIdNum = userId ? toNumber(userId) : null;

    if (!companyIdNum) {
      return res.status(400).json({ success: false, error: 'companyId is required' });
    }

    if (!userIdNum) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Fetch products for this user + company
    const userIdStr = toString(userIdNum);
    const companyIdStr = toString(companyIdNum);

    const productsRes = await pool.query(
      `SELECT *
       FROM products
       WHERE is_deleted = FALSE
         AND spare1 = $1
         AND spare2 = $2
       ORDER BY product_id DESC`,
      [userIdStr, companyIdStr]
    );

    // Type conversion for numeric fields
    const products = productsRes.rows.map(p => ({
      ...p,
      product_id: toNumber(p.product_id),
      qty: toNumber(p.qty),
      gov_rate: toNumber(p.gov_rate),
      company_rate: toNumber(p.company_rate),
      selling_rate: toNumber(p.selling_rate),
      sgst: toNumber(p.sgst),
      cgst: toNumber(p.cgst)
    }));

    return res.json({ 
      success: true, 
      userId: userIdNum,
      companyId: companyIdNum,
      products 
    });
  } catch (err) {
    console.error('Error fetching products by query:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================================
// 3. GET /api/v2/files/:fileId
// Returns: file details with form fields and shapes
// ============================================================================
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileIdNum = toNumber(fileId);

    if (!fileIdNum) {
      return res.status(400).json({ success: false, error: 'Invalid fileId' });
    }

    const fileRes = await pool.query(
      `SELECT * FROM files WHERE id = $1`,
      [fileIdNum]
    );

    if (fileRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const file = fileRes.rows[0];
    
    // Parse JSON fields if needed
    if (typeof file.shapes_json === 'string') {
      try {
        file.shapes_json = JSON.parse(file.shapes_json);
      } catch (e) {
        file.shapes_json = [];
      }
    }

    return res.json({ success: true, file });
  } catch (err) {
    console.error('Error fetching file:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================================
// 3B. GET /api/v2/files/:fileId/bill?userId=X&companyId=Y
// Returns: file + bill + bill items for the specified company
// If file has bill for different company, returns null bill
// ============================================================================
router.get('/:fileId/bill', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId, companyId } = req.query;

    const fileIdNum = toNumber(fileId);
    const userIdNum = toNumber(userId);
    const companyIdNum = toNumber(companyId);

    if (!fileIdNum || !userIdNum || !companyIdNum) {
      return res.status(400).json({ success: false, error: 'Missing required params' });
    }

    // Fetch file
    const fileRes = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND owner_id = $2',
      [fileIdNum, userIdNum]
    );

    if (fileRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const file = fileRes.rows[0];

    // Fetch bill for this file + company
    const billRes = await pool.query(
      `SELECT * FROM bills 
       WHERE file_id = $1 AND owner_id = $2 AND company_id = $3
       LIMIT 1`,
      [fileIdNum, userIdNum, companyIdNum]
    );

    let bill = null;
    let billItems = [];

    if (billRes.rows.length > 0) {
      bill = billRes.rows[0];
      
      // Type conversions for bill
      bill.bill_id = toNumber(bill.bill_id);
      bill.file_id = toNumber(bill.file_id);
      bill.owner_id = toNumber(bill.owner_id);
      bill.company_id = toNumber(bill.company_id);
      bill.company_slot_no = toNumber(bill.company_slot_no);
      bill.created_by = toNumber(bill.created_by);
      bill.total_amount = toNumber(bill.total_amount);
      bill.taxable_amount = toNumber(bill.taxable_amount);

      // Fetch bill items
      const itemsRes = await pool.query(
        `SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY item_id ASC`,
        [bill.bill_id]
      );

      billItems = itemsRes.rows.map(item => ({
        ...item,
        item_id: toNumber(item.item_id),
        bill_id: toNumber(item.bill_id),
        product_id: toNumber(item.product_id),
        gov_rate: toNumber(item.gov_rate),
        sales_rate: toNumber(item.sales_rate),
        gst_percent: toNumber(item.gst_percent),
        qty: toNumber(item.qty),
        amount: toNumber(item.amount)
      }));
    }

    return res.json({ 
      success: true, 
      file,
      bill,
      billItems
    });
  } catch (err) {
    console.error('Error fetching file bill:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ============================================================================
// 4. POST /api/v2/files
// Create new file with optional bill
// ============================================================================
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      owner_id,
      title,
      form,
      shapes,
      billItems,  // Optional: if creating with bill
      companyId   // Optional: company_id for bill
    } = req.body;

    const ownerIdNum = toNumber(owner_id);
    if (!ownerIdNum) {
      return res.status(400).json({ success: false, error: 'owner_id required' });
    }

    await client.query('BEGIN');

    // 1. Map form to database columns and prepare insert
    const mapped = mapFormToDb(form);
    const shapes_json = JSON.stringify(shapes || []);
    
    const fields = ['owner_id', 'title', 'shapes_json', ...Object.keys(mapped)];
    const values = [ownerIdNum, title || '', shapes_json, ...Object.values(mapped)];
    const params = values.map((_, i) => `$${i + 1}`).join(',');

    console.log('📝 File INSERT fields:', fields);
    console.log('📝 bill_amount in mapped:', mapped.bill_amount);
    console.log('📝 Values count:', values.length, 'Fields count:', fields.length);

    const sql = `INSERT INTO files (${fields.join(',')}) VALUES (${params}) RETURNING *`;
    const fileRes = await client.query(sql, values);

    const fileId = fileRes.rows[0].id;

    // 2. If bill items provided, create bill
    let bill = null;
    let createdBillId = null;

    if (billItems && billItems.length > 0 && companyId) {
      const billNo = form?.billNo || null;
      const billDate = form?.billDate || new Date().toISOString().split('T')[0];
      const companyIdNum = toNumber(companyId);

      const billRes = await client.query(
        `INSERT INTO bills (
          bill_no, bill_date, file_id, owner_id, company_id, 
          farmer_name, farmer_mobile, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $4, NOW(), NOW())
        RETURNING *`,
        [
          billNo,
          billDate,
          fileId,
          ownerIdNum,
          companyIdNum,
          form?.farmerName || '',
          form?.mobile || ''
        ]
      );

      createdBillId = billRes.rows[0].bill_id;

      // Insert bill items
      for (const item of billItems) {
        if (toNumber(item.qty) > 0) {
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
              toNumber(item.qty),
              toNumber(item.amount)
            ]
          );
        }
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      file: fileRes.rows[0],
      billId: createdBillId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating file:', err.message);
    console.error('Full error:', err);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// 5. PUT /api/v2/files/:fileId
// Update file (but NOT bill - that's separate)
// ============================================================================
router.put('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { owner_id, title, form, shapes } = req.body;

    const fileIdNum = toNumber(fileId);
    const ownerIdNum = toNumber(owner_id);

    if (!fileIdNum || !ownerIdNum) {
      return res.status(400).json({ success: false, error: 'Invalid params' });
    }

    // Map form to database columns
    const mapped = mapFormToDb(form);
    const shapes_json = JSON.stringify(shapes || []);
    
    console.log('📝 UPDATE - bill_amount in form:', form?.billAmount);
    console.log('📝 UPDATE - bill_amount in mapped:', mapped.bill_amount);
    
    // Build dynamic UPDATE statement
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    
    setClauses.push(`title = $${paramCount++}`);
    values.push(title || '');
    
    setClauses.push(`shapes_json = $${paramCount++}`);
    values.push(shapes_json);
    
    for (const [key, val] of Object.entries(mapped)) {
      setClauses.push(`${key} = $${paramCount++}`);
      values.push(val);
    }
    
    setClauses.push(`updated_at = NOW()`);
    values.push(fileIdNum);
    values.push(ownerIdNum);

    const sql = `UPDATE files SET ${setClauses.join(', ')} WHERE id = $${paramCount} AND owner_id = $${paramCount + 1} RETURNING *`;
    const updateRes = await pool.query(sql, values);

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    return res.json({
      success: true,
      file: updateRes.rows[0]
    });
  } catch (err) {
    console.error('Error updating file:', err.message);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

// ============================================================================
// 6. POST /api/v2/bills
// Create new bill for a file + company
// ============================================================================
router.post('/v2/bills', async (req, res) => {
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
      billId: createdBillId,
      message: 'Bill created successfully'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating bill:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

// ============================================================================
// 7. PUT /api/v2/bills/:billId
// Update bill + items
// ============================================================================
router.put('/v2/bills/:billId', async (req, res) => {
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

    // Delete existing items
    await client.query('DELETE FROM bill_items WHERE bill_id = $1', [billIdNum]);

    // Insert new items (only those with qty > 0)
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
    console.error('Error updating bill:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
