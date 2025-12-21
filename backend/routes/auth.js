// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const pool = require('../db'); // your existing db.js
const { sendOtpEmail, sendSmsOtp } = require('../utils/otp-sender');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SALT_ROUNDS = 10;
const OTP_LENGTH = 6;
const OTP_EXP_MIN = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

const createOtpCode = () => {
  return ('' + Math.floor(100000 + Math.random() * 900000)); // 6-digit
};

// simple rate limiter to prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 6, // max 6 requests per minute per IP (tune as needed)
  message: { error: 'Too many requests, slow down.' },
});

router.use(limiter);

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const {
      name, business_name, email, mobile, short_address,
      district, taluka, bank_name, account_name, account_number,
      ifsc, bank_branch, gst_no, gst_state, password
    } = req.body;

    // Basic validation
    if (!name || !business_name || !email || !mobile || !district || !taluka || !gst_no || !gst_state || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email' });
    if (!/^[6-9]\d{9}$/.test(mobile)) return res.status(400).json({ error: 'Invalid Indian mobile number' });

    // Check existing
    const existing = await pool.query('SELECT id, is_verified FROM users WHERE email=$1 OR mobile=$2', [email, mobile]);
    if (existing.rows.length) {
      const user = existing.rows[0];
      if (user.is_verified) return res.status(409).json({ error: 'User with email or mobile already exists' });
      // else proceed and resend OTP to unverified user
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // If user exists but unverified, update data; else insert new
    let userId;
    if (existing.rows.length) {
      const updateQ = `
        UPDATE users SET name=$1,business_name=$2,short_address=$3,district=$4,taluka=$5,
                         bank_name=$6,account_name=$7,account_number=$8,ifsc=$9,bank_branch=$10,
                         gst_no=$11,gst_state=$12,password_hash=$13,is_verified=$14
        WHERE id=$15 RETURNING id;
      `;
      const ures = await pool.query(updateQ, [
        name, business_name, short_address, district, taluka,
        bank_name, account_name, account_number, ifsc, bank_branch, gst_no, gst_state, password_hash, true, existing.rows[0].id
      ]);
      userId = ures.rows[0].id;
    } else {
      const q = `
        INSERT INTO users (name,business_name,email,mobile,short_address,district,taluka,
                           bank_name,account_name,account_number,ifsc,bank_branch,gst_no,gst_state,password_hash,is_verified)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING id;
      `;
      const out = await pool.query(q, [
        name, business_name, email, mobile, short_address, district, taluka,
        bank_name, account_name, account_number, ifsc, bank_branch, gst_no, gst_state, password_hash, true
      ]);
      userId = out.rows[0].id;
    }

    // Skip OTP verification - user is now verified by default
    // User can now login directly without OTP verification
    return res.json({ ok: true, message: 'Registration successful! You can now login.', userId: userId });
  } catch (err) {
    console.error('REGISTER ERR', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { target, otp } = req.body; // target = email or mobile
    if (!target || !otp) return res.status(400).json({ error: 'target and otp required' });

    const q = `
      SELECT * FROM otp_verification
      WHERE target=$1 AND otp_code=$2 AND used=false AND expires_at > now() AND purpose='registration'
      ORDER BY id DESC LIMIT 1
    `;
    const r = await pool.query(q, [target, otp]);
    if (!r.rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const row = r.rows[0];

    // mark OTP used
    await pool.query('UPDATE otp_verification SET used=true WHERE id=$1', [row.id]);

    // mark user verified
    await pool.query('UPDATE users SET is_verified=true WHERE id=$1', [row.user_id]);

    return res.json({ ok: true, message: 'Registration verified. You can now login.' });
  } catch (err) {
    console.error('VERIFY OTP ERR', err);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // username = email or mobile
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const r = await pool.query(
      'SELECT * FROM users WHERE (email=$1 OR mobile=$1) LIMIT 1',
      [username]
    );
    console.log(r.rows);
    if (!r.rows.length) return res.status(400).json({ error: 'Invalid credentials' });

    const user = r.rows[0];
    if (!user.is_verified) return res.status(403).json({ error: 'User not verified. Verify OTP first.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        business_name: user.business_name,
        district: user.district,
        taluka: user.taluka,
        gst_no: user.gst_no,
        gst_state: user.gst_state,
        is_verified: user.is_verified,
                short_address: user.short_address,
                        bank_name: user.bank_name,
        account_name: user.account_name,
        account_number: user.account_number,
                ifsc: user.ifsc,
                is_active: user.is_active
      }
    });
  } catch (err) {
    console.error('LOGIN ERR', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// FORGOT - request OTP to reset
router.post('/forgot', async (req, res) => {
  try {
    const { target } = req.body; // email or mobile
    if (!target) return res.status(400).json({ error: 'target required' });

    const r = await pool.query('SELECT id, email, mobile FROM users WHERE email=$1 OR mobile=$1 LIMIT 1', [target]);
    if (!r.rows.length) return res.status(400).json({ error: 'User not found' });

    const user = r.rows[0];
    const otpCode = createOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXP_MIN * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_verification (user_id, target, purpose, otp_code, expires_at)
       VALUES ($1,$2,'reset',$3,$4)`,
      [user.id, target, otpCode, expiresAt]
    );

    // send OTP to email or sms
    await sendOtpEmail(user.email || target, otpCode, 'reset');
    // if you prefer sms: await sendSmsOtp(user.mobile, otpCode);

    return res.json({ ok: true, message: 'OTP sent for password reset' });
  } catch (err) {
    console.error('FORGOT ERR', err);
    res.status(500).json({ error: 'Server error during forgot password' });
  }
});

// RESET password (using OTP)
router.post('/reset-password', async (req, res) => {
  try {
    const { target, otp, newPassword } = req.body;
    if (!target || !otp || !newPassword) return res.status(400).json({ error: 'target, otp and newPassword required' });

    const r = await pool.query(
      `SELECT * FROM otp_verification WHERE target=$1 AND otp_code=$2 AND used=false AND purpose='reset' AND expires_at > now() ORDER BY id DESC LIMIT 1`,
      [target, otp]
    );
    if (!r.rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const row = r.rows[0];

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [password_hash, row.user_id]);
    await pool.query('UPDATE otp_verification SET used=true WHERE id=$1', [row.id]);

    return res.json({ ok: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('RESET ERR', err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});


router.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS current_time');
    res.json({ success: true, dbTime: result.rows[0].current_time });
    console.log(result)
  } catch (err) {
    console.error('DB Test Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET USER PROFILE
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await pool.query(
      `SELECT id, name, business_name, email, mobile, short_address, 
              district, taluka, bank_name, account_name, account_number, 
              ifsc, gst_no, gst_state, is_verified 
       FROM users WHERE id=$1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('GET PROFILE ERR', err);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

// UPDATE USER PROFILE
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, business_name, email, mobile, short_address,
      district, taluka, bank_name, account_name, account_number,
      ifsc, gst_no, gst_state
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET name=$1, business_name=$2, email=$3, mobile=$4, short_address=$5,
           district=$6, taluka=$7, bank_name=$8, account_name=$9, account_number=$10,
           ifsc=$11, gst_no=$12, gst_state=$13
       WHERE id=$14
       RETURNING id, name, business_name, email, mobile, short_address,
                 district, taluka, bank_name, account_name, account_number,
                 ifsc, gst_no, gst_state`,
      [name, business_name, email, mobile, short_address, district, taluka,
       bank_name, account_name, account_number, ifsc, gst_no, gst_state, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0], message: 'Profile updated successfully' });
  } catch (err) {
    console.error('UPDATE PROFILE ERR', err);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

module.exports = router;
