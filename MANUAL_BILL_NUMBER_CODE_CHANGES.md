# Manual Bill Number - Code Changes Reference

## File 1: backend/routes/bills.js

### Change 1: POST /api/bills - Add Validation (Line ~267-295)

**BEFORE:**
```javascript
    const {
      bill_no = null,
      bill_date = null,
      ...
    } = body;
    // Support both 'items' and 'billItems' from frontend
    const items = body.items || body.billItems || [];

    // validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      // return res.status(400).json({ success:false, error: 'items required' });
    }
```

**AFTER:**
```javascript
    let {
      bill_no = null,
      bill_date = null,
      ...
    } = body;
    // Support both 'items' and 'billItems' from frontend
    const items = body.items || body.billItems || [];

    // ===== MANUAL BILL NUMBER VALIDATION =====
    // Bill number must be provided, non-blank, and follow format 01...N (sequential numbers only)
    if (!bill_no || bill_no.toString().trim() === '') {
      return res.status(400).json({ success: false, error: 'Bill number is mandatory' });
    }
    
    // Validate bill number format: only digits allowed (01, 02, 03, ... 99, 100, etc.)
    const billNoStr = bill_no.toString().trim();
    if (!/^\d+$/.test(billNoStr)) {
      return res.status(400).json({ success: false, error: 'Bill number must contain only digits (e.g., 01, 02, 03)' });
    }
    
    // Pad with leading zeros if needed (01, 02, etc.)
    bill_no = billNoStr.padStart(2, '0');
    console.log(`✅ Bill number validated: ${billNoStr} -> ${bill_no}`);

    // validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      // return res.status(400).json({ success:false, error: 'items required' });
    }
```

---

### Change 2: PUT /api/bills/:id - Add Validation (Line ~410-450)

**BEFORE:**
```javascript
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const { bill_no, bill_date, farmer_name, farmer_mobile, status = 'draft', created_by = req.body.created_by || null, company_id = null, company_slot_no = null } = req.body;
    
    // Check if user is verified
    const owner_id = req.body.owner_id ?? created_by ?? null;
    ...
```

**AFTER:**
```javascript
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    let { bill_no, bill_date, farmer_name, farmer_mobile, status = 'draft', created_by = req.body.created_by || null, company_id = null, company_slot_no = null } = req.body;
    
    // ===== MANUAL BILL NUMBER VALIDATION =====
    // Bill number must be provided, non-blank, and follow format 01...N (sequential numbers only)
    if (!bill_no || bill_no.toString().trim() === '') {
      return res.status(400).json({ success: false, error: 'Bill number is mandatory' });
    }
    
    // Validate bill number format: only digits allowed (01, 02, 03, ... 99, 100, etc.)
    const billNoStr = bill_no.toString().trim();
    if (!/^\d+$/.test(billNoStr)) {
      return res.status(400).json({ success: false, error: 'Bill number must contain only digits (e.g., 01, 02, 03)' });
    }
    
    // Pad with leading zeros if needed (01, 02, etc.)
    bill_no = billNoStr.padStart(2, '0');
    console.log(`✅ Bill number validated for update: ${billNoStr} -> ${bill_no}`);
    
    // Check if user is verified
    const owner_id = req.body.owner_id ?? created_by ?? null;
    ...
```

---

## File 2: frontend/src/app/new/page.js

### Change 1: Bill Input UI - Make Editable (Line ~3244-3270)

**BEFORE:**
```javascript
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Bill No</label>
        <input
          className="mt-1 block w-full rounded-md border border-gray-200 shadow-sm px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          value={billNo !== "-" ? formatBillNo(billNo, billDate) : "-"}
          disabled
          placeholder="Auto-generated"
        />
      </div>
```

**AFTER:**
```javascript
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Bill No <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 font-normal ml-2">(Sequential numbers: 01, 02, 03...)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="mt-1 block flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value.trim())}
            placeholder="Enter bill number (e.g., 01, 02, 03)"
          />
          <button
            type="button"
            onClick={() => {
              // Auto-suggest next bill number
              if (billDate) {
                fetchNextBillNo(billDate);
              }
            }}
            className="mt-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition whitespace-nowrap"
            title="Click to auto-suggest next sequential number"
          >
            Auto-Suggest
          </button>
        </div>
        {billNo && !/^\d+$/.test(billNo.trim()) && (
          <p className="text-xs text-red-500 mt-1">⚠️ Bill number must contain only digits (e.g., 01, 02, 03)</p>
        )}
      </div>
```

---

### Change 2: submitForm() - Add Validation (Line ~1308-1335)

**BEFORE:**
```javascript
const submitForm = async (e) => {
  e.preventDefault();

  if (saving) return;

  if (!isUserVerified()) {
    alert(t.accountNotActive || '...');
    return;
  }

  if (!form.fyYear || !form.farmerName || !form.mobile) {
    alert('Please fill in all required file fields...');
    return;
  }

  const owner_id = getCurrentUserId();
  if (!owner_id) {
    alert('User ID not found...');
    return;
  }
```

**AFTER:**
```javascript
const submitForm = async (e) => {
  e.preventDefault();

  if (saving) return;

  if (!isUserVerified()) {
    alert(t.accountNotActive || '...');
    return;
  }

  // ===== VALIDATE BILL NUMBER =====
  if (!billNo || billNo.trim() === '') {
    alert('⚠️ Bill number is mandatory. Please enter a bill number (e.g., 01, 02, 03)');
    return;
  }
  
  const billNoStr = billNo.trim();
  if (!/^\d+$/.test(billNoStr)) {
    alert('⚠️ Bill number must contain only digits (e.g., 01, 02, 03). No special characters or letters allowed.');
    return;
  }

  if (!form.fyYear || !form.farmerName || !form.mobile) {
    alert('Please fill in all required file fields...');
    return;
  }

  const owner_id = getCurrentUserId();
  if (!owner_id) {
    alert('User ID not found...');
    return;
  }
```

---

### Change 3: submitFormAndPrint() - Add Validation (Line ~1661-1668)

**BEFORE:**
```javascript
const submitFormAndPrint = async (e) => {
  e.preventDefault();

  if (saving) return;

  if (!isUserVerified()) {
    alert(t.accountNotActive || '...');
    return;
  }

  if (!form.fyYear || !form.farmerName || !form.mobile) {
    alert('Please fill in all required file fields...');
    return;
  }

  const owner_id = getCurrentUserId();
  if (!owner_id) {
    alert('User ID not found...');
    return;
  }
```

**AFTER:**
```javascript
const submitFormAndPrint = async (e) => {
  e.preventDefault();

  if (saving) return;

  if (!isUserVerified()) {
    alert(t.accountNotActive || '...');
    return;
  }

  // ===== VALIDATE BILL NUMBER =====
  if (!billNo || billNo.trim() === '') {
    alert('⚠️ Bill number is mandatory. Please enter a bill number (e.g., 01, 02, 03)');
    return;
  }
  
  const billNoStr = billNo.trim();
  if (!/^\d+$/.test(billNoStr)) {
    alert('⚠️ Bill number must contain only digits (e.g., 01, 02, 03). No special characters or letters allowed.');
    return;
  }

  if (!form.fyYear || !form.farmerName || !form.mobile) {
    alert('Please fill in all required file fields...');
    return;
  }

  const owner_id = getCurrentUserId();
  if (!owner_id) {
    alert('User ID not found...');
    return;
  }
```

---

### Change 4: Bill Payload Normalization - submitForm() (Line ~1460)

**BEFORE:**
```javascript
    const billPayload = {
      bill_no: billNo || null, // Will be auto-generated if null
      bill_date: billDate || new Date().toISOString().split('T')[0],
      ...
    };
```

**AFTER:**
```javascript
    const billPayload = {
      bill_no: billNo ? billNo.trim().padStart(2, '0') : null,  // Normalize: pad with leading zeros (01, 02, etc.)
      bill_date: billDate || new Date().toISOString().split('T')[0],
      ...
    };
```

---

### Change 5: Bill Payload Normalization - submitFormAndPrint() (Line ~1773)

**BEFORE:**
```javascript
    const billPayload = {
      file_id: fileId,
      bill_no: billNo,
      bill_date: billDate,
      ...
    };
```

**AFTER:**
```javascript
    const billPayload = {
      file_id: fileId,
      bill_no: billNo.trim().padStart(2, '0'),  // Normalize: pad with leading zeros (01, 02, etc.)
      bill_date: billDate,
      ...
    };
```

---

## File 3: frontend/src/lib/utils.js

### Change: formatBillNo() Function (Line ~73-82)

**BEFORE:**
```javascript
export function formatBillNo(billNo, billDate) {
  // Handle invalid inputs
  if (!billNo || billNo === "-" || billNo === "null") {
    return billNo || "-";
  }

  if (!billDate) {
    console.warn('formatBillNo: No billDate provided for billNo:', billNo);
    return billNo;
  }

  try {
    console.log('\n🔵 formatBillNo: billNo=' + billNo + ', billDate=' + billDate);
    
    let year, month, day;
    
    // IMPORTANT: Handle ISO format with time
    if (typeof billDate === 'string' && billDate.includes('T')) {
      console.log('   📌 ISO format detected, extracting date part only...');
      const dateMatch = billDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        year = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        day = parseInt(dateMatch[3], 10);
        console.log('   ✅ Extracted: ' + year + '-' + month + '-' + day);
      } else {
        console.warn('   ❌ Could not parse ISO date:', billDate);
        return billNo;
      }
    } else {
      const date = new Date(billDate);
      if (isNaN(date.getTime())) {
        console.warn('formatBillNo: Invalid date format:', billDate, 'for billNo:', billNo);
        return billNo;
      }
      month = date.getMonth() + 1;
      year = date.getFullYear();
      day = date.getDate();
    }

    // Calculate FY
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;

    // Format FY
    const fyFormatted = `${String(fyStartYear).slice(-2)}${String(fyEndYear).slice(-2)}`;

    // Month abbreviations
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = monthNames[month - 1];

    // Ensure billNo is padded
    const billNoFormatted = String(billNo).padStart(2, '0');

    // Return formatted: FYMONTH_NN
    const formatted = `${fyFormatted}${monthStr}_${billNoFormatted}`;
    console.log('   ✅ Formatted: ' + formatted + ' (FY' + fyStartYear + '-' + fyEndYear + ', month=' + month + ')');
    return formatted;
  } catch (e) {
    console.warn('formatBillNo error:', e, 'billNo:', billNo, 'billDate:', billDate);
    return billNo;
  }
}
```

**AFTER:**
```javascript
export function formatBillNo(billNo, billDate) {
  // NEW BEHAVIOR: Return bill number as-is (no FY/month formatting)
  // Bill numbers are now simple sequential numbers: 01, 02, 03, ...
  // No longer includes FY or month information
  
  if (!billNo || billNo === "-" || billNo === "null") {
    return billNo || "-";
  }

  // Simply ensure 2-digit padding
  return String(billNo).padStart(2, '0');
}
```

---

## Summary of Changes

| File | Type | Location | Change |
|------|------|----------|--------|
| backend/routes/bills.js | Validation | POST /api/bills | Add bill_no validation |
| backend/routes/bills.js | Validation | PUT /api/bills/:id | Add bill_no validation |
| frontend/src/app/new/page.js | UI | Bill Input Section | Make editable + add auto-suggest |
| frontend/src/app/new/page.js | Validation | submitForm() | Add bill_no validation |
| frontend/src/app/new/page.js | Validation | submitFormAndPrint() | Add bill_no validation |
| frontend/src/app/new/page.js | Normalization | Bill Payload | Normalize bill_no with padding |
| frontend/src/lib/utils.js | Display | formatBillNo() | Remove FY/month formatting |

**Total Code Changes:** 7
**Lines Added:** ~150
**Lines Removed:** ~50
**Net Addition:** ~100 lines
