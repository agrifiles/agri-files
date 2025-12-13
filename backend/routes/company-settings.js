const express = require('express');
const pool = require('../db');
const router = express.Router();

// ✅ GET all companies from master table (company_oem)
router.get('/companies/list', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT company_id, company_name FROM company_oem ORDER BY company_name'
    );
    return res.json({ success: true, companies: rows });
  } catch (err) {
    console.error('Fetch companies error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch companies' });
  }
});

// ✅ GET user's company links (max 3 companies)
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const { rows } = await pool.query(
      `SELECT cl.link_id, cl.company_id, cl.company_slot, cl.designation, 
              cl.engineer_name, cl.mobile, co.company_name
       FROM company_link cl
       LEFT JOIN company_oem co ON cl.company_id = co.company_id
       WHERE cl.user_id = $1
       ORDER BY cl.company_slot ASC`,
      [user_id]
    );
    
    return res.json({ success: true, companyLinks: rows });
  } catch (err) {
    console.error('Fetch user company links error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch company links' });
  }
});

// ✅ SAVE/UPDATE company link for user
router.post('/save', async (req, res) => {
  try {
    const {
      link_id,
      user_id,
      company_slot,
      company_id,
      designation,
      engineer_name,
      mobile
    } = req.body;

    // Validate required fields
    if (!user_id || !company_slot || !company_id || !designation || !engineer_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, company_slot, company_id, designation, engineer_name'
      });
    }

    // Validate company_slot (1, 2, or 3)
    if (![1, 2, 3].includes(parseInt(company_slot))) {
      return res.status(400).json({
        success: false,
        error: 'Company slot must be 1, 2, or 3'
      });
    }

    // Validate designation
    const validDesignations = ['sales engineer', 'sales representative', 'technical validator'];
    if (!validDesignations.includes(designation.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid designation. Must be: sales engineer, sales representative, or technical validator'
      });
    }

    if (link_id) {
      // Update existing link
      const query = `
        UPDATE company_link 
        SET company_id=$1, designation=$2, engineer_name=$3, mobile=$4, updated_at=NOW()
        WHERE link_id=$5 AND user_id=$6
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        company_id,
        designation,
        engineer_name,
        mobile || null,
        link_id,
        user_id
      ]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Company link not found' });
      }

      return res.json({ success: true, message: 'Company link updated successfully', data: rows[0] });
    } else {
      // Check if slot already exists for this user
      const existing = await pool.query(
        'SELECT link_id FROM company_link WHERE user_id=$1 AND company_slot=$2',
        [user_id, company_slot]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Company slot ${company_slot} is already occupied`
        });
      }

      // Check max 3 companies limit
      const count = await pool.query(
        'SELECT COUNT(*) as total FROM company_link WHERE user_id=$1',
        [user_id]
      );

      if (count.rows[0].total >= 3) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 3 companies allowed'
        });
      }

      // Insert new link
      const query = `
        INSERT INTO company_link (user_id, company_slot, company_id, designation, engineer_name, mobile, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;
      const { rows } = await pool.query(query, [
        user_id,
        company_slot,
        company_id,
        designation,
        engineer_name,
        mobile || null
      ]);

      return res.status(201).json({ success: true, message: 'Company link created successfully', data: rows[0] });
    }
  } catch (err) {
    console.error('Save company link error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save company link' });
  }
});

// ✅ DELETE company link
router.delete('/:link_id/:user_id', async (req, res) => {
  try {
    const { link_id, user_id } = req.params;

    const query = 'DELETE FROM company_link WHERE link_id=$1 AND user_id=$2 RETURNING link_id';
    const { rows } = await pool.query(query, [link_id, user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Company link not found' });
    }

    return res.json({ success: true, message: 'Company link deleted successfully' });
  } catch (err) {
    console.error('Delete company link error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete company link' });
  }
});

// ✅ SYNC PRODUCTS - Auto-migrate products when company changes (Phase 7)
// When user changes which company is in a slot (e.g., Slot 1: Company A → Company B),
// all products linked to old company are migrated to new company
router.post('/sync-products', async (req, res) => {
  try {
    const {
      user_id,
      company_slot,
      old_company_id,
      new_company_id
    } = req.body;

    // Validate required fields
    if (!user_id || !company_slot || !old_company_id || !new_company_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, company_slot, old_company_id, new_company_id'
      });
    }

    // Validate company_slot (1, 2, or 3)
    if (![1, 2, 3].includes(parseInt(company_slot))) {
      return res.status(400).json({
        success: false,
        error: 'Company slot must be 1, 2, or 3'
      });
    }

    // Prevent syncing if old and new are the same
    if (old_company_id === new_company_id) {
      return res.json({
        success: true,
        message: 'No changes needed - same company',
        updatedCount: 0
      });
    }

    console.log(`[SYNC-PRODUCTS] User: ${user_id}, Slot: ${company_slot}, Old: ${old_company_id}, New: ${new_company_id}`);

    // Get all products currently linked to old company for this user
    const getProductsQuery = `
      SELECT product_id, spare2, spare3
      FROM products
      WHERE spare1 = $1 AND spare2 = $2
    `;
    const productsResult = await pool.query(getProductsQuery, [user_id, old_company_id]);
    const productsToUpdate = productsResult.rows;

    console.log(`[SYNC-PRODUCTS] Found ${productsToUpdate.length} products to migrate`);

    // If no products found, return early
    if (productsToUpdate.length === 0) {
      return res.json({
        success: true,
        message: 'No products to sync - old company had no products',
        updatedCount: 0
      });
    }

    // Update all products: old company_id → new company_id
    const updateQuery = `
      UPDATE products
      SET spare2 = $1, spare3 = $2, updated_at = NOW()
      WHERE spare1 = $3 AND spare2 = $4
      RETURNING product_id, spare2, spare3
    `;

    const updateResult = await pool.query(updateQuery, [
      new_company_id,
      company_slot,  // Store company_slot in spare3 for tracking
      user_id,
      old_company_id
    ]);

    const updatedProducts = updateResult.rows;

    console.log(`[SYNC-PRODUCTS] Successfully updated ${updatedProducts.length} products`);

    // Log the migration for audit trail (optional)
    console.log(`[SYNC-PRODUCTS-AUDIT] User ${user_id} - Slot ${company_slot}: ${old_company_id} → ${new_company_id}, Products: ${updatedProducts.length}`);

    return res.json({
      success: true,
      message: `Successfully synced ${updatedProducts.length} product(s) to new company`,
      updatedCount: updatedProducts.length,
      products: updatedProducts,
      audit: {
        user_id,
        company_slot,
        old_company_id,
        new_company_id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[SYNC-PRODUCTS-ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync products',
      details: err.message
    });
  }
});

// ✅ GET SYNC STATUS - Check how many products will be affected by sync (Phase 7)
router.get('/sync-status/:user_id/:old_company_id', async (req, res) => {
  try {
    const { user_id, old_company_id } = req.params;

    // Count products that would be affected
    const query = `
      SELECT COUNT(*) as count
      FROM products
      WHERE spare1 = $1 AND spare2 = $2
    `;
    const result = await pool.query(query, [user_id, old_company_id]);
    const affectedCount = result.rows[0].count;

    return res.json({
      success: true,
      affectedProductsCount: affectedCount,
      message: affectedCount > 0 
        ? `${affectedCount} product(s) will be migrated`
        : 'No products to migrate'
    });

  } catch (err) {
    console.error('[SYNC-STATUS-ERROR]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to check sync status',
      details: err.message
    });
  }
});

module.exports = router;
