const express = require('express');
const pool = require('../db'); // reusing your existing PostgreSQL pool
const router = express.Router();

// ✅ Add or Update Product
router.post('/save', async (req, res) => {
  try {
    const {
      product_id,
      description_of_good,
      hsn_code,
      batchNo,
      cmlNo,
      size,
      class: productClass,
      qty,
      govRate,
      companyRate,
      sellingRate,
      unit,
      sgst,
      cgst,
      bis,
      spare1,
      spare2,
      spare3
    } = req.body;

    if (!description_of_good) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (product_id) {
      // 🔁 Update existing product (spare1, spare2, spare3 stay unchanged)
      const query = `
        UPDATE products SET
          description_of_good=$1, hsn_code=$2, batch_no=$3, cml_no=$4, size=$5, class=$6,
          qty=$7, gov_rate=$8, company_rate=$9, selling_rate=$10, unit_of_measure=$11,
          sgst=$12, cgst=$13, bis=$14, updated_at=NOW()
        WHERE product_id=$15 AND is_deleted=FALSE
      `;
      const values = [
        description_of_good || '',
        hsn_code || '',
        batchNo || null,
        cmlNo || null,
        size || null,
        productClass || null,
        qty || null,
        govRate || null,
        companyRate || null,
        sellingRate || null,
        unit || null,
        sgst || null,
        cgst || null,
        bis || null,
        product_id
      ];
      console.log('UPDATE query values count:', values.length, 'Values:', values);
      const result = await pool.query(query, values);
      return res.json({ success: true, message: 'Product updated successfully', rowsAffected: result.rowCount });
    } else {
      // Add new product (store spare1, spare2, spare3)
      const query = `
        INSERT INTO products (
          description_of_good, hsn_code, batch_no, cml_no, size, class,
          qty, gov_rate, company_rate, selling_rate, unit_of_measure,
          sgst, cgst, bis, spare1, spare2, spare3
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING product_id
      `;
      const values = [
        description_of_good,
        hsn_code,
        batchNo,
        cmlNo,
        size,
        productClass,
        qty,
        govRate,
        companyRate,
        sellingRate,
        unit,
        sgst,
        cgst,
        bis,
        spare1 ?? null,
        spare2 ?? null,
        spare3 ?? null
      ];
      const out = await pool.query(query, values);
      console.log(`Product saved - spare1: ${spare1}, spare2: ${spare2}, spare3: ${spare3}`);
      return res.json({ success: true, message: 'Product added successfully', product_id: out.rows[0].product_id });
    }

  } catch (err) {
    console.error('Product save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }





});

/**
 * ✅ Get all products
 */
router.get("/list", async (req, res) => {
  try {
    const userId = req.query.user_id ?? null;
    console.log('GET /products/list user_id=', userId);

    if (userId) {
      // use parameterized query and pass [userId] to pool.query
      const q = `
        SELECT *
        FROM products
        WHERE is_deleted = FALSE
          AND (spare1 = $1 OR spare1 = 'master_User')
        ORDER BY product_id ASC
      `;
      console.log('Query with param. Params:', [userId]);
      const result = await pool.query(q, [userId]);   // <-- pass parameter here
      return res.json({ success: true, products: result.rows });
    } else {
      // no user supplied -> return only master_User entries
      const q = `
        SELECT *
        FROM products
        WHERE is_deleted = FALSE
          AND spare1 = 'master_User'
        ORDER BY product_id DESC
      `;
      console.log('Query without param (master only)');
      const result = await pool.query(q);
      return res.json({ success: true, products: result.rows });
    }
  } catch (err) {
    console.error("GET /products/list ERROR:", err && (err.stack || err));
    res.status(500).json({ success: false, error: "Database error fetching products." });
  }
});



/**
 * ✅ Soft Delete Product
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE products SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE product_id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: "Product not found." });

    res.json({ success: true, message: "Product deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ success: false, error: "Database error deleting product." });
  }
});

/**
 * ✅ Check if user is new FOR A SPECIFIC COMPANY (no products for that company yet)
 */
router.get("/check-new-user/:userId/:companyId", async (req, res) => {
  try {
    const { userId, companyId } = req.params;
    
    const result = await pool.query(
      'SELECT COUNT(*)::int as product_count FROM products WHERE spare1 = $1 AND spare2 = $2 AND is_deleted = FALSE',
      [userId, companyId]
    );
    
    const productCount = result.rows[0].product_count;
    const isNewUser = productCount === 0;
    
    console.log(`New user check - userId: ${userId}, companyId: ${companyId}, productCount: ${productCount}, isNewUser: ${isNewUser}`);
    
    res.json({
      success: true,
      isNewUser: isNewUser,
      productCount: productCount
    });
  } catch (err) {
    console.error('Error checking new user:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * ✅ Copy standard products to user
 * Copies all standard products (spare1='standard') to user's products with user_id, company_id, slot_no
 */
router.post("/copy-standard-products", async (req, res) => {
  try {
    const { userId, companyId, slotNo } = req.body;
    
    if (!userId || !companyId || !slotNo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId, companyId, slotNo' 
      });
    }

    // Get all standard products
    const standardProducts = await pool.query(
      'SELECT * FROM products WHERE spare1 = $1 AND is_deleted = FALSE ORDER BY product_id',
      ['standard']
    );

    if (standardProducts.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No standard products found' 
      });
    }

    console.log(`Copying ${standardProducts.rows.length} standard products for user ${userId}, company ${companyId}, slot ${slotNo}`);

    // Copy each standard product to user
    const copiedProducts = [];
    for (const product of standardProducts.rows) {
      const query = `
        INSERT INTO products (
          description_of_good, hsn_code, batch_no, cml_no, size, class,
          qty, gov_rate, company_rate, selling_rate, unit_of_measure,
          sgst, cgst, bis, spare1, spare2, spare3
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING product_id
      `;
      
      const values = [
        product.description_of_good,
        product.hsn_code,
        product.batch_no,
        product.cml_no,
        product.size,
        product.class,
        product.qty,
        product.gov_rate,
        product.company_rate,
        product.selling_rate,
        product.unit_of_measure,
        product.sgst,
        product.cgst,
        product.bis,
        userId,  // spare1 = user_id
        companyId,  // spare2 = company_id
        slotNo   // spare3 = slot_no
      ];
      
      const result = await pool.query(query, values);
      copiedProducts.push({
        original_id: product.product_id,
        new_product_id: result.rows[0].product_id,
        description: product.description_of_good
      });
    }

    console.log(`Successfully copied ${copiedProducts.length} products`);
    
    res.json({
      success: true,
      message: `Copied ${copiedProducts.length} standard products successfully`,
      copiedCount: copiedProducts.length,
      products: copiedProducts
    });
  } catch (err) {
    console.error('Error copying standard products:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
