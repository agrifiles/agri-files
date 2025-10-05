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
      qty,
      govRate,
      companyRate,
      sellingRate,
      unit,
      sgst,
      cgst,
      bis
    } = req.body;

    if (!description_of_good || !hsn_code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (product_id) {
      // 🔁 Update existing product
      const query = `
        UPDATE products SET
          description_of_good=$1, hsn_code=$2, batch_no=$3, cml_no=$4, size=$5,
          qty=$6, gov_rate=$7, company_rate=$8, selling_rate=$9, unit_of_measure=$10,
          sgst=$11, cgst=$12, bis=$13, updated_at=NOW()
        WHERE product_id=$14 AND is_deleted=FALSE
      `;
      const values = [
        description_of_good,
        hsn_code,
        batchNo,
        cmlNo,
        size,
        qty,
        govRate,
        companyRate,
        sellingRate,
        unit,
        sgst,
        cgst,
        bis,
        product_id
      ];
      await pool.query(query, values);
      return res.json({ success: true, message: 'Product updated successfully' });
    } else {
      // ➕ Add new product
      const query = `
        INSERT INTO products (
          description_of_good, hsn_code, batch_no, cml_no, size,
          qty, gov_rate, company_rate, selling_rate, unit_of_measure,
          sgst, cgst, bis
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING product_id
      `;
      const values = [
        description_of_good,
        hsn_code,
        batchNo,
        cmlNo,
        size,
        qty,
        govRate,
        companyRate,
        sellingRate,
        unit,
        sgst,
        cgst,
        bis
      ];
      const out = await pool.query(query, values);
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
    const result = await pool.query(
      "SELECT * FROM products WHERE is_deleted = FALSE ORDER BY product_id DESC"
    );
    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error("Error fetching products:", err);
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

module.exports = router;
