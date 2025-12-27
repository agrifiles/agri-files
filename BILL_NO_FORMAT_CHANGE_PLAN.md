# Bill Number Format Change Plan

## Current Format
- **Current**: `YYYYMM_NN` (e.g., `2025DEC_01`, `2025DEC_02`)
- Year and Month embedded in bill number
- Restarts each FY (Financial Year: April to March)

## New Format
- **Target**: `NN` (e.g., `01`, `02`, `03`, ... `n`)
- Only sequential numbers, no year/month prefix
- **Still maintains FY logic**: Resets on 1st April (FY start), continues throughout the year
- **Still rearranges**: If bill date changes across FY boundary, sequence adjusts

---

## Files to Update

### 1. **Backend - Bill Number Generation Route**
**File**: `backend/routes/bills.js`

#### Location A: Line 129-170 (Current `router.get('/next-bill-no')`)
- **Current Logic**: Queries all FY month prefixes, extracts sequence from `2025DEC_01` format
- **Change**: 
  - Still fetch all bills in current FY (Apr-Mar)
  - But instead of matching prefixes like `2025DEC_%`, just count ALL bills in that FY
  - Extract sequence number (currently after `_`), but format it differently
  - Return simple format: `01`, `02`, etc. (no year/month prefix)

**Current Code Block:**
```javascript
router.get('/next-bill-no', async (req, res) => {
  try {
    const ownerId = parseInt(req.query.owner_id, 10);
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    if (!ownerId || !month || !year) {
      return res.status(400).json({ success: false, error: 'owner_id, month, and year are required' });
    }

    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const monthStr = monthNames[month - 1];
    const prefix = `${year}${monthStr}_`;  // <-- REMOVE THIS

    // FY logic
    const fyStartYear = month >= 4 ? year : year - 1;
    const fyEndYear = fyStartYear + 1;

    const fyPrefixes = [];
    for (let m = 4; m <= 12; m++) {
      fyPrefixes.push(`${fyStartYear}${monthNames[m - 1]}_%`);
    }
    for (let m = 1; m <= 3; m++) {
      fyPrefixes.push(`${fyEndYear}${monthNames[m - 1]}_%`);
    }

    const sql = `
      SELECT MAX(CAST(SPLIT_PART(bill_no, '_', 2) AS INTEGER)) AS max_seq
      FROM bills
      WHERE owner_id = $1
        AND bill_no LIKE ANY (ARRAY[${fyPrefixes.map((_, i) => `$${i + 2}`).join(',')}])
    `;

    const { rows } = await pool.query(sql, [ownerId, ...fyPrefixes]);

    let nextSeq = (rows[0]?.max_seq ?? 0) + 1;

    const nextBillNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;  // <-- CHANGE TO JUST: String(nextSeq).padStart(2, '0')
```

**What needs to change:**
- Remove `prefix` variable creation (line with `const prefix = ...`)
- Change SQL query to count bills in FY WITHOUT using prefixes (just count where bill_no is numeric)
- Change final format from `${prefix}${String(nextSeq).padStart(2, '0')}` → `${String(nextSeq).padStart(2, '0')}`

---

### 2. **Frontend - Bill Sorting & Parsing Logic**
**File**: `frontend/src/app/files/page.js`

#### Location A: Line 45-67 (`getFYFromBillNo` function)
**Current Logic**: Extracts year and month from format like `2025DEC_04`
**Change**: Comment out this function (no longer needed) OR modify to handle simple numbers

**Current Code:**
```javascript
const getFYFromBillNo = (billNo) => {
  if (!billNo || billNo === "-") return 0;
  
  // Extract year and month from bill_no (e.g., "2025DEC_04" → 2025, DEC)
  const yearMatch = billNo.match(/^\d+/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
  
  const monthMatch = billNo.match(/([A-Z]{3})/);
  const monthStr = monthMatch ? monthMatch[1] : "";
  
  const monthMap = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };
  const month = monthMap[monthStr] || 0;
  
  // Calculate FY: Apr onwards = same year, Jan-Mar = previous year
  if (month >= 3) { // Apr onwards
    return year;
  } else {
    return year - 1;
  }
};
```

**Decision**: Since new format is just numbers, this function won't extract year/month from bill_no. 
- **Option 1**: Comment it out (won't be used)
- **Option 2**: Modify to get FY from `bill_date` field instead

#### Location B: Line 71-99 (`parseBillNo` function)
**Current Logic**: Parses `2025DEC_04` → `{year: 2025, month: 11, seq: 4, fy: 2025}`
**Change**: Comment out OR simplify to just extract sequence number

**Current Code:**
```javascript
const parseBillNo = (billNo) => {
  if (!billNo || billNo === "-") return { year: 0, month: 0, seq: 0, fy: 0 };
  
  // Extract year (e.g., "2025" from "2025DEC_04")
  const yearMatch = billNo.match(/^\d+/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
  
  // Extract month abbreviation (e.g., "DEC" from "2025DEC_04")
  const monthMatch = billNo.match(/([A-Z]{3})/);
  const monthStr = monthMatch ? monthMatch[1] : "";
  
  // Convert month abbreviation to number (JAN=0, FEB=1, ..., DEC=11)
  const monthMap = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };
  const month = monthMap[monthStr] || 0;
  
  // Extract sequence number (e.g., "04" from "2025DEC_04")
  const seqMatch = billNo.match(/_(\d+)$/);
  const seq = seqMatch ? parseInt(seqMatch[1], 10) : 0;
  
  // Calculate FY year
  const fy = month >= 3 ? year : year - 1;
  
  console.log(`🔍 Parse "${billNo}" → year:${year}, month:${month}, seq:${seq}, fy:${fy}`);
  return { year, month, seq, fy };
};
```

**Change**: 
- Since new format is just `01`, `02`, etc., the parsing becomes simple
- Extract sequence directly from bill_no (it IS the sequence)
- FY must come from `bill_date` field instead
- Simplify to: `{ seq: parseInt(billNo, 10), fy: calculateFromBillDate(...) }`

#### Location C: Line 101-155 (`sortFilesByBillNo` function)
**Current Logic**: Sorts by year → month (if different FY) → sequence
**Change**: Modify sorting logic since we no longer have year/month in bill_no
- Still need to sort by FY (from bill_date)
- Then by sequence number

**What changes:**
- Calculate FY from `bill_date` instead of `bill_no`
- Simplify comparison logic (no more year/month extraction)
- Still maintains: FY restart logic + rearrange on FY boundary change

---

### 3. **Associated Changes - Data Validation**
**File**: `backend/routes/bills.js` (Other locations)

#### Location A: Line 251-300+ (POST `/api/bills` - Bill creation)
- When saving new bill, ensure `bill_no` is stored as simple number (`01`, `02`, etc.)
- Logic already extracts `bill_no` from request, just needs backend validation

#### Location B: Line 523+ (POST `/api/bills/:id/duplicate` - Bill duplication)
- When copying bill, regenerate bill_no with new sequence (same as creating new)

#### Location C: Line 668+ (POST `/api/v2/bills` - Alternative bill creation)
- Ensure same logic as regular bill creation

#### Location D: Line 850+ (POST `/api/v2/bills/resequence-fy` - FY resequencing)
- This route resequences bills when date changes across FY boundary
- Update to work with simple number format instead of `YYYYMM_NN` format

---

## Implementation Strategy

### Step 1: Backend Changes
1. Update `router.get('/next-bill-no')` in `bills.js` lines 129-170
   - Remove prefix logic
   - Change SQL to count all bills in FY range
   - Return simple format `01`, `02`, etc.

### Step 2: Frontend Changes  
2. Update parsing and sorting functions in `files/page.js`
   - Comment out or modify `getFYFromBillNo()` lines 45-67
   - Simplify `parseBillNo()` lines 71-99
   - Update `sortFilesByBillNo()` logic lines 101-155

### Step 3: Validation
3. Ensure bill creation still works
4. Test FY restart logic
5. Test bill rearrangement on date change across FY boundary

---

## Summary of Changes

| Location | Type | Change | Impact |
|----------|------|--------|--------|
| `bills.js:129-170` | Code | Remove year/month prefix from bill number generation | Bill numbers will be `01` to `n` instead of `2025DEC_01` |
| `files/page.js:45-67` | Code | Comment out `getFYFromBillNo()` or modify to use `bill_date` | FY calculation from date, not bill_no |
| `files/page.js:71-99` | Code | Simplify `parseBillNo()` to extract sequence only | Faster parsing |
| `files/page.js:101-155` | Code | Update `sortFilesByBillNo()` comparator logic | Sort still works with FY boundary logic intact |

**No database migration needed** - existing `bill_no` field structure remains same, just format changes from `2025DEC_01` to `01`.

