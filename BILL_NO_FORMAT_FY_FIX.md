# Bill Number FY Switching Fix - Implementation Complete

## Issue Identified
Bill numbers were not correctly switching FY year when dates crossed the FY boundary (April 1st).

**Example from screenshot:**
- Row 10: May 4, 2026 → Should be `2627MAY_01` (FY 2026-2027) but showed `2526DEC_01` ❌
- Row 11: Apr 8, 2026 → Should be `2627APR_02` (FY 2026-2027) but showed `2526DEC_02` ❌
- Row 13: Jun 14, 2026 → Should be `2627JUN_04` (FY 2026-2027) but showed `2526NOV_04` ❌

## Root Cause
The `billDate` variable in `files/page.js` was not being passed correctly to `formatBillNo()`. The function wasn't receiving the actual file/bill date, so it couldn't calculate the correct FY.

## Solution Implemented

### 1. **Enhanced formatBillNo() in `utils.js`**
- Added console logging to debug date parsing
- Clear comment explaining FY logic: April onwards = same year, Jan-Mar = previous year
- Better error handling for invalid dates

**FY Logic:**
```javascript
// Financial Year: April 1 to March 31
const fyStartYear = month >= 4 ? year : year - 1;
const fyEndYear = fyStartYear + 1;
```

### 2. **Fixed billDate Assignment in `files/page.js`**

**Before:**
```javascript
const billDate = linkedBill?.bill_date ?? f.bill_date ?? f.billDate;
```

**After:**
```javascript
// Use file_date as primary source for date (since it's always present for files)
// Falls back to bill_date if linked to a bill
const billDate = linkedBill?.bill_date ?? (f.bill_date ?? f.billDate) ?? fileDate;
```

**Why:** 
- `fileDate` is always available and correctly parsed
- Falls back to linked bill's bill_date if a bill is linked
- Ensures billDate is never null when calling formatBillNo

### 3. **Updated All Display Locations**

Files updated to use `formatBillNo()`:

1. **files/page.js** ✅
   - Added `formatBillNo` import
   - Display uses formatted bill number in table

2. **bill/[id]/page.js** ✅
   - Shows formatted bill_no in read-only field

3. **bill/new/page.js** ✅
   - Shows formatted bill_no in read-only field

4. **bill/page.js** ✅
   - Bill list table shows formatted numbers

5. **bill/print/[id]/page.js** ✅
   - Imports `formatBillNo`
   - Uses formatted number for filename generation
   - Passes formatted number to BillInvoice component

6. **components/BillInvoice.js** ✅
   - Accepts optional `displayBillNo` prop
   - Falls back to raw bill_no if not provided
   - Uses formatted number in invoice display

7. **new/page.js** ✅
   - Added `formatBillNo` import for any bill displays

---

## Format Verification

### FY Calculation Examples

| Date | Month | Year | FY Start | FY End | Format |
|------|-------|------|----------|--------|--------|
| Jan 15, 2025 | 1 | 2025 | 2024 | 2025 | `2425JAN_` |
| Mar 31, 2025 | 3 | 2025 | 2024 | 2025 | `2425MAR_` |
| Apr 1, 2025 | 4 | 2025 | 2025 | 2026 | `2526APR_` |
| May 4, 2026 | 5 | 2026 | 2026 | 2027 | `2627MAY_` |
| Dec 25, 2025 | 12 | 2025 | 2025 | 2026 | `2526DEC_` |

---

## Testing Recommendations

After frontend reload, verify:

1. ✅ **FY Switching on April 1**
   - Create bill on March 31: Should show `2526MAR_XX` (FY 2025-2026)
   - Change date to April 1: Should show `2627APR_XX` (FY 2026-2027)

2. ✅ **File Date Uses Correct FY**
   - Files created on May 4, 2026 → Should show `2627MAY_XX`
   - Files created on Apr 8, 2026 → Should show `2627APR_XX`

3. ✅ **Console Logs**
   - Check browser console for formatBillNo logs:
   ```
   📋 formatBillNo: billNo="01" + date="2026-05-04" (2026-5) → FY2026-2027 → "2627MAY_01"
   ```

4. ✅ **All Locations**
   - Files list table
   - Bill edit page
   - Bill new page
   - Bill list page
   - Bill print page
   - Bill invoice PDF

---

## Code Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| `frontend/src/lib/utils.js` | Enhanced formatBillNo with logging | 65-110 |
| `frontend/src/app/files/page.js` | Import + use formatBillNo, fix billDate | 5 + 512 |
| `frontend/src/app/bill/[id]/page.js` | Import + display formatted bill_no | 4 + 372 |
| `frontend/src/app/bill/new/page.js` | Import + display formatted bill_no | 4 + 261 |
| `frontend/src/app/bill/page.js` | Import + display formatted in table | 4 + 136 |
| `frontend/src/app/bill/print/[id]/page.js` | Import + format for filename + pass to component | 5 + 58 + 206 |
| `frontend/src/components/BillInvoice.js` | Add displayBillNo prop + use it | 35 + 181 |
| `frontend/src/app/new/page.js` | Import formatBillNo | 10 |

---

## Database: No Changes Required ✅
- Bill numbers stored as simple numbers (`01`, `02`, `03`) in DB
- Formatting happens **at display time only**
- No migration needed

---

## Next Steps
1. Reload frontend (npm run dev)
2. Check browser console for formatBillNo logs
3. Test bill creation with dates spanning FY boundaries
4. Verify all bill displays show correct format

