# Complete Testing Guide - V2 API

## System Status Check

### ✅ Backend
- Port 5006: RUNNING
- Routes registered: `/api/v2/*`
- Database: Connected (Neon PostgreSQL)

### ✅ Frontend
- All 20 API calls migrated to v2
- No TypeScript/ESLint errors
- Ready for testing

---

## Test Case 1: Create New File with Bill

**Objective:** Verify file + bill creation with v2 API

**Steps:**
1. Go to http://localhost:3000/new
2. Fill form:
   - FY Year: 2025-26
   - Farmer Name: Test Farmer
   - Mobile: 9123456789
   - District: [Select any]
   - Taluka: [Auto-populated]
   - Village: Test Village
   - Company: [Select from dropdown - loaded via v2 API]
   - File Date: Today's date

3. Click "Bill Details" tab
4. **Expected:** Bill section shows with all products for selected company
5. Enter quantities for 3-5 products
6. Click "Save & Print"

**Expected Results:**
- File created with `id` returned
- Bill created with items (qty > 0 only)
- Redirect to print/success page
- `owner_id` properly set in bill
- `company_id` properly set in bill
- Bill items have correct product_id, qty, amounts

**Console Check:**
- Look for: ✅ "Fetched user company links"
- Look for: ✅ "Loaded X products"
- No errors about `owner_id` or `company_id` missing

---

## Test Case 2: Edit Existing File

**Objective:** Verify file loading and bill item restoration

**Prerequisites:** Must have created a file in Test Case 1

**Steps:**
1. Note the file ID from success page
2. Go to http://localhost:3000/new?id=<FILE_ID>
3. **Expected:** Form auto-populates with all saved data
4. Click "Bill Details" tab
5. **Expected:** Bill items show with quantities from original bill

**Expected Results:**
- File details loaded correctly
- Bill company is correct
- Bill items show with correct quantities (not all 0)
- Products list shows all products for that company
- No warnings in console

**Console Check:**
- Look for: ✅ "File loaded for edit"
- Look for: ✅ company details
- No 404 errors

---

## Test Case 3: Change Company While Editing

**Objective:** Verify company switching with caching

**Prerequisites:** File must have bill with items for Company A

**Steps:**
1. Load file in edit mode (from Test Case 2)
2. Bill shows items for original company
3. Change company dropdown to different company
4. **Expected:** Confirmation dialog appears
5. Click "OK" to confirm
6. **Expected:** 
   - Products refresh for new company
   - Bill items reset to 0
   - Old company's items cached
7. Add items for new company (qty > 0)
8. Change company back to original
9. **Expected:** 
   - Original items restored from cache
   - Quantities back to original values

**Expected Results:**
- Caching system works (items preserved when switching back)
- No data loss when changing companies
- Products always correct for selected company

**Console Check:**
- Look for: "💾 Caching X items for company"
- Look for: "✅ Restoring X cached items"

---

## Test Case 4: Multiple Companies (Max 3)

**Objective:** Verify multiple companies work correctly

**Steps:**
1. Create/edit file with Company 1
2. Add bill items for Company 1
3. Switch to Company 2
4. Add different bill items
5. Switch to Company 3
6. Add different bill items
7. Switch back through all companies
8. **Expected:** Items cache/restore correctly for each

**Expected Results:**
- Each company has its own cached items
- Switching between 3 companies works smoothly
- No items from other companies appear
- Cache persists across all switches

---

## Test Case 5: Bill Amounts Calculation

**Objective:** Verify bill totals are calculated correctly

**Steps:**
1. Create new file with Company
2. Enter items with:
   - Product A: qty=100, rate=25.50, gst=5%
   - Product B: qty=50, rate=100, gst=18%
3. **Expected:**
   - Product A amount: 2550.00
   - Product B amount: 5000.00
   - Subtotal: 7550.00
   - GST calculation correct
   - Total amount correct

**Expected Results:**
- Calculations match manual math
- Amounts update when qty changes
- GST% applied correctly per item
- Fitting charges (if enabled) calculated correctly

---

## Test Case 6: Mobile Responsive View

**Objective:** Verify UI works on mobile devices

**Steps:**
1. Open file creation page on mobile (or use browser dev tools)
2. Fill form (should stack vertically)
3. Go to Bill tab
4. Switch between desktop/mobile cards view
5. Scroll and interact with bill items

**Expected Results:**
- Form is fully responsive
- Bill items show in card format on mobile
- Tables show on desktop
- All inputs are accessible
- No overflow or layout issues

---

## Test Case 7: Error Handling

**Objective:** Verify graceful error handling

**Steps:**
1. Try to create file without selecting company
   - **Expected:** Alert "Please fill required fields"
2. Try to create file without farmer name
   - **Expected:** Alert "Please fill required fields"
3. Try to add bill items without saving file first
   - **Expected:** Bill section might be disabled or items not saved

**Expected Results:**
- Proper validation messages
- No API errors in console
- User-friendly error messages
- No blank screens or crashes

---

## Test Case 8: Concurrent Company Changes

**Objective:** Verify no race conditions with rapid company changes

**Steps:**
1. Load file in edit mode
2. Rapidly click between company dropdowns (3-4 times)
3. Wait for debounce (should see loading state)
4. **Expected:** Only final selection loads products

**Expected Results:**
- No duplicate API calls
- No mixed product lists
- Correct final state

---

## Test Case 9: Large Bill Items

**Objective:** Verify system handles files with many items

**Steps:**
1. Create file and select company with many products (50+)
2. Add items to 20+ products
3. Try to save
4. **Expected:** File saves successfully with all items

**Expected Results:**
- Large item lists handled correctly
- No truncation
- All items save properly
- Performance acceptable (< 5 seconds)

---

## Test Case 10: Print Functionality

**Objective:** Verify printed bill shows correct data

**Steps:**
1. Create and save file with bill items
2. Click "Save & Print"
3. Print preview/page should show:
   - Farmer name, mobile
   - Bill date
   - All selected items with qty, rate, amount
   - Totals (subtotal, GST, final amount)
4. Actually print to PDF

**Expected Results:**
- Bill format is correct
- All items visible
- Amounts correct
- No missing data
- Layout looks professional

---

## Console Monitoring Checklist

Watch for these in browser console while testing:

**Good Signs:**
- ✅ "Fetched user company links"
- ✅ "Loaded X products"
- ✅ "File loaded for edit"
- ✅ "Bill created successfully"
- ✅ "File updated successfully"

**Bad Signs:**
- ❌ 404 errors from /api/v2/* endpoints
- ❌ "owner_id is null/undefined"
- ❌ "Failed to convert to number"
- ❌ Duplicate API calls
- ❌ Null reference errors

---

## Database Verification

Run these queries to verify data:

```sql
-- Check file was created
SELECT * FROM files WHERE owner_id = YOUR_USER_ID ORDER BY id DESC LIMIT 1;

-- Check bill was created
SELECT * FROM bills WHERE owner_id = YOUR_USER_ID ORDER BY bill_id DESC LIMIT 1;

-- Check bill items
SELECT * FROM bill_items WHERE bill_id = (
  SELECT bill_id FROM bills WHERE owner_id = YOUR_USER_ID ORDER BY bill_id DESC LIMIT 1
);

-- Check company links
SELECT * FROM company_link WHERE user_id = YOUR_USER_ID;

-- Check products for company
SELECT COUNT(*) FROM products WHERE spare1 = 'YOUR_USER_ID' AND spare2 = 'COMPANY_ID';
```

---

## Success Criteria

✅ All 10 test cases pass
✅ No errors in console
✅ Database entries are correct
✅ Bill totals calculate correctly
✅ Company switching with caching works
✅ Mobile and desktop views work
✅ Print functionality works
✅ Performance is acceptable (< 5 sec per operation)
✅ No race conditions or duplicate API calls

---

## If Tests Fail

1. **404 errors on /api/v2 endpoints:**
   - Restart backend: `cd backend && node server.js`
   - Check server.js has `require('./routes/files-v2')`

2. **owner_id is null:**
   - Check localStorage has user object
   - Verify `getCurrentUserId()` works
   - Check user logged in

3. **Products don't load:**
   - Verify products exist in database for that company
   - Check `spare1` = user ID (as string)
   - Check `spare2` = company ID (as string)
   - Run: `SELECT * FROM products WHERE spare1 = 'USER_ID' AND spare2 = 'COMPANY_ID'`

4. **Bill items not saved:**
   - Check `owner_id` is in billPayload
   - Check items have qty > 0
   - Check database constraints

5. **Company caching not working:**
   - Check `billItemsCache` state is being set
   - Check company_id is converted to string for cache key
   - Monitor console for "Caching" and "Restoring" logs
