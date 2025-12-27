# Debug Guide - Bill Number Format Issue

## How to Debug

### Step 1: Open Browser Console
1. Reload frontend: `npm run dev`
2. Open the Files page
3. Open **Browser Developer Tools** (F12)
4. Go to **Console** tab
5. Check for logs starting with `📥`, `📍`, `🔵`, and `═══`

### Step 2: Look for These Log Sections

#### A. API Response Data (Yellow Section)
```
═══════════════════════════════════════════
📥 Files received from API:
═══════════════════════════════════════════

📄 File #1:
   file_date: "2026-05-04"
   bill_no: "01"
   billNo: "01"
   bill_date: "null" or "2026-05-04" or undefined
   billDate: undefined
   id: 123

📄 File #10:
   file_date: "2026-05-04"
   bill_no: "01"
   billNo: "null" or null or undefined
   ...
```

**What to check:**
- ✅ Is `file_date` present and valid?
- ✅ What is `bill_no`? (should be `01`, `02`, etc.)
- ✅ What is `bill_date`? (might be null or undefined)

#### B. Bills Data (Blue Section)
```
═══════════════════════════════════════════
📥 Bills received from API:
═══════════════════════════════════════════

💵 Bill #1:
   bill_no: "01"
   bill_date: "2026-05-04"
   file_id: 123
   bill_id: 456

💵 Bill #10:
   bill_no: "01"
   bill_date: "2026-05-04"
   file_id: 456
   bill_id: 789
```

#### C. Format Function Logic (Green Section - formatBillNo)
```
═══════════════════════════════════════════
🔵 formatBillNo CALLED
───────────────────────────────────────────
📥 INPUT:
   billNo: "01" (type: string)
   billDate: "2026-05-04" (type: string)

🔄 Parsing date...
   Date object: Sat May 04 2026 00:00:00 GMT+0530 (India Standard Time)
   Date.getTime(): 1746374400000
   isNaN(date.getTime()): false

📊 PARSED DATE COMPONENTS:
   year: 2026
   month (1-12): 5

📈 FY CALCULATION:
   month >= 4? true
   fyStartYear: 2026
   fyEndYear: 2027

   fyFormatted: "2627"

🔤 MONTH MAPPING:
   monthNames[4]: "MAY"

🔢 BILL NO FORMATTING:
   billNo: "01"
   billNoFormatted: "01"

✅ OUTPUT:
   formatted: "2627MAY_01"
═══════════════════════════════════════════
```

#### D. Row Calculation (Orange Section)
```
📍 FILES TABLE ROW 10:
   fBillNo: "01"
   linkedBill: YES
   billNo (to format): "01"
   f.bill_date: "2026-05-04"
   fileDate: "2026-05-04"
   billDate (final): "2026-05-04"
   linkedBill?.bill_date: "2026-05-04"
   displayBillNo (result): "2627MAY_01"
```

---

## Common Issues & Solutions

### Issue 1: `billDate (final)` is null or undefined
**Problem:** The date is not being passed correctly
**Solution:** Check:
- Is `file_date` in the API response?
- Is `billDate` in the file object?

### Issue 2: `Date object` shows `Invalid Date`
**Problem:** Date format is incorrect
**Solution:** Check:
- Date format should be `YYYY-MM-DD`
- Not `DD-MM-YYYY` or other formats

### Issue 3: `month (1-12)` is wrong
**Problem:** JavaScript months are 0-indexed (0=Jan, 11=Dec)
**Solution:** We add 1 in the code: `date.getMonth() + 1`
- Check if this is calculating correctly

### Issue 4: FY shows 2526 instead of 2627 for May 2026
**Problem:** FY calculation is wrong
**Solution:** Check:
- month >= 4? Should be TRUE for May (5)
- If FALSE, then date is being parsed as previous year

### Issue 5: Month shows wrong abbreviation
**Problem:** monthNames array indexing is off
**Solution:** Check:
- `monthNames[4]` should be `MAY` (0-indexed)
- If showing wrong month, date parsing is wrong

---

## What to Do When You Find the Issue

### Scenario A: billDate is undefined/null
**Root cause:** API is not returning the date or we're not finding it correctly

**Check in backend:**
- `GET /api/v2/files` - does it return `file_date`?
- `GET /api/bills` - does it return `bill_date`?

**Check in frontend:**
- Is the file_date field name correct? (Could be `fileDate` or `file_date`)
- Is the bill_date field name correct?

### Scenario B: formatBillNo is getting wrong date but displaying nothing
**Root cause:** Date parsing is failing but function is returning original billNo

**Check:**
- The console should show what date string is being passed
- Look for `📊 PARSED DATE COMPONENTS` section
- If this section is missing, there's an error

### Scenario C: FY calculation is wrong (shows 2526 for May 2026)
**Root cause:** The year being parsed is 2025, not 2026

**Check:**
- What is the actual `year` in `PARSED DATE COMPONENTS`?
- If it shows 2025, then the API is returning wrong year
- If it shows 2026, then `month >= 4` check is failing

---

## Copy This in Console to Test Manually

```javascript
// Test the format function manually
formatBillNo("01", "2026-05-04")
// Should output: "2627MAY_01"

// Test with wrong date
formatBillNo("01", "2025-12-25")
// Should output: "2526DEC_01"

// Test with invalid date
formatBillNo("01", "invalid")
// Should output: "01"
```

---

## Steps to Report Issue

When you report the issue, please include:

1. **Screenshot of Console Output** - Share the entire console log showing:
   - Files API response
   - Bills API response
   - At least 2-3 formatBillNo calls
   - At least 2-3 FILES TABLE ROW logs

2. **Expected vs Actual:**
   - What should it show?
   - What is it actually showing?

3. **File Date Example:**
   - The file_date value
   - The bill_no value
   - The displayBillNo (wrong output)

This will help pinpoint exactly where the logic is failing!

